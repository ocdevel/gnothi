

// needs to be listened to top-level, before child components are instantiated with {form}
import {UpsertProps} from "./Utils.tsx";
import {useCallback, useEffect, useMemo} from "react";
import {shallow} from "zustand/shallow";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useStore} from "../../../../data/store";
import {fields_post_request} from "../../../../../../schemas/fields.ts";

const scoringDefaults = {
  score_enabled: true,
  analyze_enabled: true,
  reset_every: 1,
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
  reset_quota: 1,
}
const laneDefaults = {
  custom: {
    score_enabled: false,
    analyze_enabled: true,
    type: "fivestar",
  },
  habit: {
    ...scoringDefaults,
    type: "number",
    reset_period: "daily",
  },
  daily: {
    ...scoringDefaults,
    type: "check",
    reset_period: "daily",
    default_value: "value",
    default_value_value: 0,
  },
  todo: {
    ...scoringDefaults,
    type: "check",
    reset_period: "forever",
    score_up_good: true,
  },
  reward: {
    ...scoringDefaults,
    type: "number",
    reset_period: "forever",
    score_up_good: false,
  }
}

export function useFormWatcher(): UpsertProps['form'] {
  const [
    fields,
    view,
  ] = useStore(s => [
    s.res.fields_list_response,
    s.behaviors.view,
  ], shallow)
  const form = useForm<fields_post_request>({
    resolver: zodResolver(fields_post_request),
  })
  const lane = form.watch("lane")

  const [field, fid] = useMemo(() => {
    const fid = view.view === "edit" && view.fid || null
    if (fid) {
      const field = fields?.hash?.[fid]
      return [field, fid]
    }
    const clickedLane = (view.view === "new" && view.fid || "custom") as keyof typeof laneDefaults
    const field = fields_post_request.omit({name: true}).parse({
      lane: clickedLane,
      ...laneDefaults[clickedLane]
    })
    return [field, fid]
  }, [view, fields?.hash])


  useEffect(() => {
    console.log({view})
    form.reset(field)
  }, [field])

  useEffect(() => {
    if (!lane) {
      // not available via form yet. TODO look into this, I didn't expect this.
      return
    }
    console.log({lane})
    // FIXME there's no form.setValues() (multiple), and instead there's form.reset({values}); but that resets
    // things like subscriptions, dirty states, etc. Which sucks, because the below causes a ton of re-renders
    for (let [k, v] of Object.entries(laneDefaults[lane])) {
      form.setValue(k, v)
    }
  }, [lane])
  return [form, field, fid]
}