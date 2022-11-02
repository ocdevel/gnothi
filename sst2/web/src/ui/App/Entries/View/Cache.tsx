import {useStore} from "../../../../data/store";
import {Alert2} from "../../../Components/Misc";
import _ from "lodash";
import React from "react";

export default function CacheEntry() {
  const cache = useStore(s => s.res.entries_cache_get_response?.first)
  if (!cache) {return null}
  return <>
    <Alert2 severity='info'>
      Paragraphs get split in the following way, and AI considers each paraph independently from the other (as if they're separate entries).
    </Alert2>
    <div>{cache.paras
      ? cache.paras.map((p, i) => <div key={i}>
        <p>{p}</p><hr/>
      </div>)
      : <p>Nothing here yet.</p>
    }</div>
    <Alert2 severity='info'>Keywords generated for use in Themes</Alert2>
    <div>{cache.clean
      ? cache.clean.map((p, i) => <div key={i}>
        <p>{_.uniq(p.split(' ')).join(' ')}</p>
        <hr/>
      </div>)
      : <p>Nothing here yet.</p>
    }</div>
  </>
}
