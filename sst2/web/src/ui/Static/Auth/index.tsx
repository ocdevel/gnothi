import {useEffect} from 'react'
import {useStore} from "@gnothi/web/src/data/store";

export default function Stub() {
  const setJwt = useStore(state => state.setJwt)
  const setUser = useStore(state => state.setUser)
  function login() {
    setJwt("test")
    setUser({username: "test", email: "test@test.com"})
  }
  useEffect(() => {
    login()
  }, [])
  return null
}
