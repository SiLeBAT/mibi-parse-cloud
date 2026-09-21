# mibi-parse-cloud

## Dates

Dates come in two kinds, and they are handled differently.

**Timestamps** are moments in time, such as `createdAt`. They are stored and
sent as UTC instants in ISO 8601, and shown in the reader's local time.

**Calendar dates** carry no time and no timezone: a sampling date, an isolation
date, the date a catalog becomes valid. They are parsed as UTC midnight and read
back with UTC getters, so they stay the same day wherever the code runs. Never
read them with local getters (`getFullYear`, `getMonth`, `getDate`) and never
build them with `new Date(year, month, day)`.

**"Today" and "the current year"** are business values and are taken in
`Europe/Berlin`. Not from the host timezone, which nothing in this repository
sets, and not from plain UTC either: between 00:00 and 02:00 Berlin time the UTC
date is still yesterday, which would report a sample taken today as a sample
taken in the future.

Never produce or read the output of `Date.prototype.toString()`. It depends on
the machine's locale and timezone.

The helpers in `src/modules/shared/domain/date` implement these rules:

| Helper                       | Use                                                      |
| ---------------------------- | -------------------------------------------------------- |
| `parseCalendarDate(value)`   | reads a sample sheet date ("05.06.2026") as UTC midnight |
| `todayInBerlin(now?)`        | today's Berlin date, as UTC midnight                     |
| `currentYearInBerlin(now?)`  | the current year in Berlin                               |
| `toCalendarDateString(date)` | writes a stored calendar date as "YYYY-MM-DD"            |

Both `now?` parameters exist so tests can pass a fixed clock.

A date bug is easy to miss on a machine in Berlin, because it only shows up in
another timezone. Before merging a change that touches dates, run the tests in
UTC, in Berlin time and in a timezone behind UTC:

```
npm run test:timezones
```
