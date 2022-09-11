import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Header } from './Header'

export const Layout: React.FC = ({ children }) => {
  return (
    <Header>
      <Grid container>
        <Grid item md={12} display={{ xs: 'none', md: 'inline-block' }}>
          {children}
        </Grid>
        <Grid item xs={12} display={{ md: 'none' }}>
          <Typography>This site is not optimized for mobile. Please view on a desktop.</Typography>
        </Grid>
      </Grid>
    </Header>
  )
}
