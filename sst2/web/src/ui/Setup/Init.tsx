import {useLocation} from "react-router-dom";
import {useEffect} from "react";

export default function Init() {
  const location = useLocation()
  useEffect(() => {
    const search = new URLSearchParams(location.search)
    const code = search.get("code")
    if (code) {
      window.localStorage.setItem("affiliate", code)
    }
  }, [])
  return null
}
