import {FullScreenDialog} from "../../Components/Dialog";
import {Typography} from "@mui/material";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import {useStore} from "../../../data/store";
import Prompt, {PromptModal} from './Insights/Prompt'

export default function InsightsModal () {
  const insightsModal = useStore(s => s.insightsModal)
  const setInsightsModal = useStore(s => s.setInsightsModal)

  return <FullScreenDialog
    title=""
    open={insightsModal !== null}
    onClose={() => setInsightsModal(null)}
    ctas={[]}
    className="insights"
    backButton={true}
  >
    <Container maxWidth={false}>
      {insightsModal === "prompt" ? <PromptModal /> : null}
    </Container>
  </FullScreenDialog>
}
