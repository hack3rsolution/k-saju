/**
 * Centralised dayjs instance with all plugins pre-registered.
 *
 * Always import dayjs from THIS file instead of 'dayjs' directly so that
 * plugins are guaranteed to be extended before first use.
 *
 *   ✅  import dayjs from '../lib/dayjs'
 *   ❌  import dayjs from 'dayjs'          // plugins may not be registered yet
 */

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import utc from 'dayjs/plugin/utc';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(utc);

export default dayjs;
