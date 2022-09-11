import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'

export default function App() {
  return (
    <>
      <Grid sx={{ mt: '1rem' }} spacing={1} container>
        <Grid item xs={12} lg={4}>
          <Stack spacing="0.5rem">
            <Typography variant="caption">
              Welcome to IGS. This website will allow you to explore the reciprocal relation between
              primal and dual representations of the forms and forces in a few common structural
              topologies.
            </Typography>
            <Typography variant="caption">
              In some cases, you will also be able to explore the material and carbon implications
              of the reciprocal relation.
            </Typography>
            <Divider />
            <Typography variant="caption">
              This website is a work-in-progress under ungoing development. If you would like to
              contribute or leave feedback/comments, please visit the{' '}
              <Link href="https://github.com/szvsw/interactive-graphic-statics">
                GitHub repository
              </Link>
              .
            </Typography>
            <Typography variant="caption">
              Thank you to Caitlin Mueller, John Ochsendorf and Moh Ismail for their wonderful
              sources of inspiration.
            </Typography>
            <Typography variant="caption">
              This IGS application is also inspired by the mid-2000s web-based graphic statics
              demonstrations written by Phillipe Block, Simon Greenwold, Edward Allen, and Waclaw
              Zalewski.
            </Typography>
            <Typography variant="overline">©2022, Sam Wolk </Typography>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}
