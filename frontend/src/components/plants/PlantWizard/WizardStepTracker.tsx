import { Fragment } from 'react';
import Box from '@mui/material/Box';
import SpaIcon from '@mui/icons-material/Spa';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ParkIcon from '@mui/icons-material/Park';

import { WIZARD_STEPS } from './constants';

const STEP_ICONS = [
  <SpaIcon sx={{ fontSize: 15 }} />,
  <LocalFloristIcon sx={{ fontSize: 17 }} />,
  <ParkIcon sx={{ fontSize: 20 }} />,
];

interface WizardStepTrackerProps {
  activeStep: number;
}

function WizardStepTracker({ activeStep }: WizardStepTrackerProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      {WIZARD_STEPS.map((s, i) => {
        const state: 'done' | 'current' | 'todo' =
          i < activeStep ? 'done' : i === activeStep ? 'current' : 'todo';
        return (
          <Fragment key={s.key}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 56,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  transition: 'all 300ms',
                  ...(state === 'done' && {
                    backgroundColor: '#14532d',
                    color: '#fbf6ec',
                  }),
                  ...(state === 'current' && {
                    backgroundColor: '#fbf6ec',
                    color: '#14532d',
                    border: '2px solid #14532d',
                  }),
                  ...(state === 'todo' && {
                    backgroundColor: '#fbf6ec',
                    color: 'rgba(20,83,45,0.3)',
                    border: '1px solid rgba(20,83,45,0.2)',
                  }),
                }}
              >
                {STEP_ICONS[i]}
              </Box>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1,
                  color: state === 'todo' ? 'rgba(20,83,45,0.35)' : '#14532d',
                  transition: 'color 300ms',
                }}
              >
                {s.label}
              </span>
            </Box>

            {i < WIZARD_STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  marginTop: '19px',
                  borderRadius: 1,
                  backgroundColor: i < activeStep ? '#14532d' : 'rgba(20,83,45,0.18)',
                  transition: 'background-color 500ms',
                }}
              />
            )}
          </Fragment>
        );
      })}
    </Box>
  );
}

export default WizardStepTracker;
