import create from 'zustand'
import * as S from "@gnothi/schemas"
import dayjs, {Dayjs} from 'dayjs'

export const fmt = 'YYYY-MM-DD'
export function iso(day?: Dayjs | string) {
  return dayjs(day).format(fmt)
}

type ShowForm = "new" | string | false
type ShowChart = "overall" | string | false
interface FieldsStore {
  day: Dayjs
  dayStr: string
  setDay: (day: Dayjs) => void
  isToday: boolean
  selectedField: S.Fields.fields_post_request | null
  showForm: ShowForm
  setShowForm: (showForm: ShowForm) => void
  showChart: ShowChart
  setShowChart: (showChart: ShowChart) => void
}

export const useFieldsStore = create<FieldsStore>((set, get) => ({
  day: dayjs(),
  dayStr: iso(),
  setDay: (day) => set(state => ({
    day,
    dayStr: iso(day),
    isToday: iso() === iso(day),
  })),
  isToday: true,
  selectedField: null,
  showForm: false,
  setShowForm: (showForm) => set({showForm}),
  showChart: false,
  setShowChart: (showChart) => set({showChart})
}))

