import Alert from '@mui/material/Alert'
import {useStore} from '../../data/store'
import {shallow} from 'zustand/shallow'
import Typography from "@mui/material/Typography";
import React, {useState, useEffect, useCallback} from "react";
import {create} from "zustand";

// Have the state up here so that anyone using <Banner /> has the same notifications
interface LocalStore {
  banners: React.ReactNode[]
  addBanner: (banner: React.ReactNode) => void
  closeBanner: (i: number) => void
}
const useLocalStore = create<LocalStore>((set, get) => ({
  banners: [
    // <Typography>Hi! Welcome to the new version of the site. We're still working on it, so please excuse any bugs.</Typography>
  ],
  addBanner: (banner) => set(s => ({banners: [...s.banners, banner]})),
  closeBanner: (i) => set(s => ({
    banners: get().banners.filter((_, j) => i !== j)
  }))
}))

/**
 * Any sort of banner notifications we want to show the user. New stuff, premium-upgraded account, etc.
 * TODO: we'll want to persist closed notifications to user
 */
export default function Banner() {
  const [stripe_webhook_success] = useStore(s => [
    s.res.stripe_webhook_success?.first
  ], shallow)
  const [banners, addBanner, closeBanner] = useLocalStore(s => [
    s.banners,
    s.addBanner,
    s.closeBanner
  ], shallow)

  useEffect(() => {
    if (stripe_webhook_success) {
      addBanner(<Typography>Your account has been upgraded to premium! Your entries are being re-generated with higher-quality AI. It takes about 2 seconds per entry.</Typography>)
    }
    // add any alerts to banner we listen to here.
  }, [stripe_webhook_success])

  function renderBanner(banner: React.ReactNode, i: number) {
    return <Alert key={i} onClose={() => closeBanner(i)}>{banner}</Alert>
  }

  return <>
    {banners.map(renderBanner)}
  </>
}
