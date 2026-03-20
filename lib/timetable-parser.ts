import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const timetablePrompt = `You are an expert timetable parser.

I will give you an image of a weekly class timetable. Your job is to carefully read the timetable and convert it into a clean, structured JSON output.

IMPORTANT RULES:
1. Do NOT treat every visible box as a separate class by default.
2. Many timetable cells are merged across multiple adjacent time slots.
3. If one subject visually spans across 2 or more time columns, then its duration must cover all those combined time slots.
   Example:
   - If "ECL 356 (G3)" stretches across both:
     - 10:40–11:30
     - 11:30–12:20
   then the correct time is:
     - start_time = "10:40"
     - end_time = "12:20"
4. Parse based on visual span and alignment, not just text placement.
5. Ignore decorative colors unless they help distinguish merged cells.
6. Keep lunch/break columns separate and do not assign classes into them unless clearly shown.
7. If text is blurry or uncertain, do NOT hallucinate.
   Instead:
   - keep the most likely value
   - add "uncertain": true
   - add a short "note" explaining the ambiguity
8. Preserve day names exactly as shown if possible.
9. Preserve subject labels exactly as seen in the image as much as possible.
10. If a subject includes section/group info like (G3) or (G4), keep it inside the subject string.
11. Use 24-hour or am/pm format consistently. Prefer the exact visible timetable slot boundaries.
12. Output only valid JSON. No markdown. No explanation outside JSON.

WHAT TO EXTRACT:
- days of the week
- each class block for each day
- subject name
- start time
- end time
- optional uncertainty note if needed

OUTPUT FORMAT:
{
  "days": {
    "Monday": [
      {
        "subject": "ECT 352",
        "start_time": "09:50",
        "end_time": "10:40"
      },
      {
        "subject": "ECL 356 (G3)",
        "start_time": "10:40",
        "end_time": "12:20"
      }
    ],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": []
  },
  "meta": {
    "lunch_break": {
      "start_time": "12:20",
      "end_time": "13:10"
    },
    "parser_rules_applied": [
      "merged_cells_combined_into_single_class_blocks",
      "uncertain_text_flagged_when_needed"
    ]
  }
}

STEP-BY-STEP PARSING INSTRUCTIONS:
1. Read the top header row and identify all time slot boundaries from left to right.
2. Read the day labels from top to bottom.
3. For each day row, inspect each colored/filled/text cell.
4. Determine whether the cell spans 1, 2, or more adjacent time columns.
5. Assign start_time as the left boundary of the merged block.
6. Assign end_time as the right boundary of the merged block.
7. If two neighboring time slots contain one continuous merged subject block, combine them into one JSON entry.
8. Do not split one continuous visual subject block into multiple entries.
9. If a subject appears only in one slot, keep it as one-slot duration.
10. If part of the row is blank, do not create an entry for that blank portion.

VALIDATION BEFORE FINAL OUTPUT:
- Check that no class overlaps incorrectly within the same day unless the image clearly shows overlap.
- Check that merged cells have been combined.
- Check that start_time and end_time match the full visual width of each subject block.
- Check that blank cells are not turned into fake classes.
- Check that lunch is not mistaken as a class.
- Check JSON syntax carefully.

IF SOMETHING IS UNCLEAR:
Use this structure:
{
  "subject": "E-II*/E-II**",
  "start_time": "15:40",
  "end_time": "16:30",
  "uncertain": true,
  "note": "Text in the image is blurry; subject label may be slightly incorrect."
}

Now parse the timetable image and return only the final JSON.`;

const classBlockSchema = z.object({
  subject: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  uncertain: z.boolean().nullable(),
  note: z.string().nullable(),
});

const daysSchema = z.object({
  Monday: z.array(classBlockSchema),
  Tuesday: z.array(classBlockSchema),
  Wednesday: z.array(classBlockSchema),
  Thursday: z.array(classBlockSchema),
  Friday: z.array(classBlockSchema),
  Saturday: z.array(classBlockSchema),
  Sunday: z.array(classBlockSchema),
});

const timetableSchema = z.object({
  days: daysSchema,
  meta: z.object({
    lunch_break: z
      .object({
        start_time: z.string(),
        end_time: z.string(),
      })
      .nullable(),
    parser_rules_applied: z.array(z.string()),
  }),
});

export type ParsedTimetable = z.infer<typeof timetableSchema>;

export async function parseTimetableImage(file: File): Promise<ParsedTimetable> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/png";

  const response = await client.responses.parse({
    model: "gpt-5.4",
    reasoning: {
      effort: "none",
    },
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: timetablePrompt }],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Parse this weekly timetable image into the required JSON format.",
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${base64}`,
            detail: "auto",
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(timetableSchema, "timetable"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI did not return a parsed timetable.");
  }

  return response.output_parsed;
}
