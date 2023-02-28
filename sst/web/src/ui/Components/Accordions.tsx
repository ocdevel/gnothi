import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import React from "react";

interface Accordion {
  title: string
  subtitle: string
  content: React.ReactNode
}

interface Props {
  accordions: Accordion[]
}

export default function Accordions({accordions}: Props) {
  const [expanded, setExpanded] = React.useState<number>(-1);

  const handleChange =
    (panel: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : -1);
    };

  function renderAccordion(accordion: Accordion, i: number) {
    const {title, subtitle, content} = accordion
    return <Accordion expanded={expanded === i} onChange={handleChange(i)}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon/>}
        aria-controls={`panel${i}bh-content`}
        id={`panel${i}bh-header`}
      >
        <Typography sx={{width: '33%', flexShrink: 0}}>
          {title}
        </Typography>
        <Typography sx={{color: 'text.secondary'}}>
          {subtitle}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {content}
      </AccordionDetails>

    </Accordion>
  }

  return <div>{accordions.map(renderAccordion)}</div>
}
