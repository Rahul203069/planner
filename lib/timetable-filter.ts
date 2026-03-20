type TimetableClass = {
  subject: string;
  start_time: string;
  end_time: string;
  uncertain: boolean | null;
  note: string | null;
};

type TimetableData = {
  days: Record<string, TimetableClass[]>;
  meta: {
    lunch_break: {
      start_time: string;
      end_time: string;
    } | null;
    parser_rules_applied: string[];
  };
};

const supportedGroups = ["G1", "G2", "G3", "G4"] as const;

export type SupportedGroup = (typeof supportedGroups)[number];

export function isSupportedGroup(value: string): value is SupportedGroup {
  return supportedGroups.includes(value as SupportedGroup);
}

function extractGroups(subject: string): SupportedGroup[] {
  const matches = subject.match(/\bG[1-4]\b/g) ?? [];
  return matches.reduce<SupportedGroup[]>((groups, group) => {
    if (isSupportedGroup(group)) {
      groups.push(group);
    }

    return groups;
  }, []);
}

export function filterTimetableByGroup(
  timetable: TimetableData,
  selectedGroup: SupportedGroup
): TimetableData {
  return {
    ...timetable,
    days: Object.fromEntries(
      Object.entries(timetable.days).map(([day, classes]) => [
        day,
        classes.filter((entry) => {
          const groupsInSubject = extractGroups(entry.subject);

          if (groupsInSubject.length === 0) {
            return true;
          }

          return groupsInSubject.includes(selectedGroup);
        }),
      ])
    ),
  };
}
