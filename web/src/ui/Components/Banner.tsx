import Alert from '@mui/material/Alert'
import {useStore} from '../../data/store'
import {shallow} from 'zustand/shallow'
import Typography from "@mui/material/Typography";
import React, {useState, useEffect, useCallback} from "react";
import {create} from "zustand";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// Have the state up here so that anyone using <Banner /> has the same notifications
interface LocalStore {
  banners: React.ReactNode[]
  addBanner: (banner: React.ReactNode) => void
  closeBanner: (i: number) => void
}
const useLocalStore = create<LocalStore>((set, get) => ({
  banners: [
    <SunsetBanner key="sunset" />
  ],
  addBanner: (banner) => set(s => ({banners: [...s.banners, banner]})),
  closeBanner: (i) => set(s => ({
    banners: get().banners.filter((_, j) => i !== j)
  }))
}))

// FIXME bug where it adds the banner twice. The fix will be tracking these by id anyway
let didPremium = false

/**
 * Any sort of banner notifications we want to show the user. New stuff, premium-upgraded account, etc.
 * TODO: we'll want to persist closed notifications to user
 */
function SunsetBanner() {
  const [open, setOpen] = useState(false);

  return (
    <>
      Important: This project may be shutting down soon. Your data will remain accessible.
      <Button color="inherit" size="small" onClick={() => setOpen(true)}>
        Learn More
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Important Update About Gnothi's Future</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            After 5.5 years and much personal financial investment, with only ~$100 in subscription revenue,
            I can no longer afford to maintain this project.
          </Typography>
          <Typography paragraph>
            I'm working on a data export feature that will be available before and after the sunset date,
            ensuring you'll always have access to your data.
          </Typography>
          <Typography paragraph>
            While unlikely, if enough users subscribe or donate, the project could continue. If you'd like to help
            or have questions, please reach out at <a href="https://ocdevel.com/contact">ocdevel.com/contact</a>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

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
    if (stripe_webhook_success && !didPremium) {
      didPremium = true
      addBanner(<Typography>Your account has been upgraded to premium! Your entries are being re-generated with higher-quality AI. It takes about 2 seconds per entry.</Typography>)
    }
    // add any alerts to banner we listen to here.
  }, [stripe_webhook_success])

  function renderBanner(banner: React.ReactNode, i: number) {
    // First banner (sunset) gets warning style, others get info style
    return <Alert 
      severity={i === 0 ? "warning" : undefined}
      key={i} 
      onClose={() => closeBanner(i)}
    >
      {banner}
    </Alert>
  }

  return <>
    {banners.map(renderBanner)}
  </>
}