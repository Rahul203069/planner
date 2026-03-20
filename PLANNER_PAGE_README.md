# Planner Page README

## Core Goal

The Planner page should help the user do four things fast:

- See the fixed class schedule
- See free time around classes
- Add tasks quickly
- Place tasks into real time slots manually

The page should feel like a combination of:

- Timetable
- Task inbox
- Drag-and-drop planner

The core product feeling should be:

`My classes are already handled. Now I just place work around them.`

The page should not feel like:

- A complicated planner
- A full AI scheduler
- A giant spreadsheet

It should feel:

- Calm
- Visual
- Manual
- Fast

## Best Page Structure

### 1. Top Header

Keep a simple top header with:

- Page title: `Planner`
- Week switcher: previous week / current week / next week
- View toggle: `Week` / `Day`
- Button: `Add Task`
- Button: `Edit Timetable`

Optional summary:

`Free today: 5h 20m | Planned: 3 tasks`

This header should provide orientation without clutter.

### 2. Main Layout

Best desktop split:

- Left panel: `35%`
- Right panel: `65%`

The left side is for tasks.
The right side is for the weekly planner.

## Left Panel

This side is for creating and managing tasks before placing them into the calendar.

### A. Quick Add Task Box

Place a compact task form at the top of the left panel.

Fields:

- Task name
- Category
- Duration
- Due date
- Preferred time
- Priority

UX guidance:

- Start with a one-line compact input
- Let `More options` expand the extra fields
- Keep capture light and fast

Example:

- Task name: `Build auth page`
- Duration: `2h`
- Category: `Project`
- Preferred time: `After class`

### B. Unplanned Tasks List

Below the quick add form, show:

`Unplanned Tasks`

This is the planning queue. Every task should land here first unless the user directly assigns a slot.

Each task row or card should show:

- Task title
- Duration
- Due date
- Category color or tag
- Preferred time
- Priority

Example:

- `Revise DBMS Unit 3`
- `1h 30m`
- `Due tomorrow`
- `Study`
- `After class`
- `High priority`

### C. Planned Tasks / Optional Tabs

Tabs can be:

- `Unplanned`
- `Planned`
- `Completed`

For MVP, even this is enough:

- `Unplanned`
- `Completed`

Once a task is placed into the calendar, the schedule becomes the main source of truth.

### D. Filters

Add lightweight filters near the task list:

- Category
- Due today / this week
- Priority
- Unscheduled only

Use chips or small dropdowns, not heavy table filters.

## Right Panel

This is the heart of the page.

Show a weekly timetable or calendar with:

- Days as columns
- Time rows vertically

Suggested visible time range:

- `6 AM` to `11 PM`

This side should clearly show three things:

1. Fixed class blocks
2. Free slots
3. Planned task blocks

### 1. Fixed Class Blocks

These come from the uploaded timetable.

They should feel:

- Locked
- Slightly muted
- Clearly different from tasks

Display:

- Subject or class name
- Start and end time
- Optional room or teacher

Styling:

- Light gray or outlined block
- Lower emphasis than tasks
- Optional lock icon

These are structure, not draggable task cards.

### 2. Free Slots

Free time should be visually obvious through empty calendar space.

Optional UX enhancements:

- Subtle hover highlight
- Show time range on click
- Allow dropping tasks into the empty slot

### 3. Planned Task Blocks

When a user drags a task into the calendar, it becomes a scheduled block.

Display:

- Task name
- Duration
- Category
- Optional icon or tag

Behavior:

- Draggable
- Resizable
- Easy to edit

Example:

- `Build landing page`
- `7:00 PM - 9:00 PM`
- `Project`

## Best Interaction Flow

### Flow 1: Add Then Place

Default flow:

User adds a task in the left panel
-> task appears in `Unplanned`
-> user drags it to a free slot on the calendar

### Flow 2: Click Empty Slot First

User clicks a free slot on the calendar
-> a small drawer or modal opens
-> user creates a task directly in that time

Support both:

- Task-first planning
- Time-first planning

### Flow 3: Move Task

The user should be able to drag a planned task between times and days.

Examples:

- Move from afternoon to night
- Move from Monday to Tuesday

This interaction should feel smooth and instant.

### Flow 4: Resize Task Duration

The user should be able to stretch a task longer or shorter.

Examples:

- `DSA practice` from `1h` to `1h 30m`
- `Revision` from `2h` to `45m`

This is a strong UX feature and worth keeping in scope after the first basic drag-and-drop flow.

## Best Visual Hierarchy

The user should notice things in this order:

1. Today and the current week
2. Fixed classes
3. Unplanned important tasks
4. Available free time
5. Smaller labels, notes, and metadata

Do not overload the screen with too many colors.

## Should It Be A Table?

Not as the main UX.

A table is acceptable for admin views or backend-style management, but the planner itself should feel like:

- Compact task list on the left
- Visual timetable on the right

Table-like rows inside the task list are fine. The whole page should not feel like Excel.

## Ideal Desktop Layout

Top:

- Planner header

Left panel:

- Quick add task
- Unplanned tasks
- Filters

Right main area:

- Weekly calendar
- Classes locked in place
- Free slots open
- Planned tasks draggable

Optional:

- Right-side details drawer on click

## Detail Drawer UX

When clicking a task, open a side drawer with:

- Task name
- Category
- Duration
- Due date
- Preferred time
- Notes
- Mark done
- Unschedule
- Delete

When clicking a class, open a drawer with:

- Subject
- Time
- Recurrence
- Edit timetable entry

This keeps the main screen clean and avoids too many modals.

## Empty State UX

If the user has not uploaded a timetable yet, show:

`Upload your timetable to start planning around your classes`

Buttons:

- `Upload Timetable`
- `Add Manually`

If the timetable exists but there are no tasks yet, show:

`Add tasks and drag them into your free time`

The empty state should teach the product quickly.

## Mobile UX

Do not force the full desktop planner onto mobile.

Recommended mobile structure:

- `Schedule`
- `Tasks`
- `Add`

Or:

- Day view on top
- Unplanned tasks in a bottom sheet

A day view on mobile is usually better than a full week view.

## Best MVP Version

For MVP, keep only:

- Header
- Week switcher
- Add task
- Edit timetable
- Left panel quick add
- Left panel unplanned tasks
- Right panel week calendar with locked classes
- Drag tasks into slots
- Edit task
- Mark task done
- Reschedule task

That is enough for a strong first version.

## Features To Add Later

Later iterations can add:

- Clash warning
- Overload warning
- Best slot suggestions
- Recurring tasks
- Exam mode / project mode
- Missed task reschedule

Do not add all of these in the first version.

## Recommended Final Structure

Planner page:

- Top bar
- Planner
- Week switcher
- Add task
- Edit timetable

Left panel:

- Quick add task
- Unplanned tasks
- Filters

Right panel:

- Weekly timetable
- Class blocks locked
- Task blocks draggable into free time

Side drawer:

- Task details
- Class details
- Editing actions

This is the cleanest structure for the product.
