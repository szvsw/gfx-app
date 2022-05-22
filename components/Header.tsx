import React, { ReactNode } from 'react'
import Head from 'next/head'
import Button from '@mui/material/Button';
import Link from 'next/link'
import ButtonGroup from '@mui/material/ButtonGroup';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

type Props = {
  children: ReactNode;
};


export const Header: React.FC<Props> = (props) => {
	return (
    <div>
      <Head>
        <title>Interactive Graphic Statics</title>
      </Head>

      <Box sx={{p: "2rem"}}>

        <Stack direction="row" sx={{alignItems: "center", justifyContent: "space-between"}}>
          <Link href="/">
          <Button variant="text">
            <Typography variant="h2">Interactive Graphic Statics</Typography>
          </Button>
          </Link>
          <Box>
          <ButtonGroup size="small" variant="outlined">
            <Link href="/equilibrium-node">
              <Button >Equilibrium Node</Button>
            </Link>
            <Link href="/hookes-law">
              <Button >Hooke's Law</Button>
            </Link>
            <Link href="/counterweighted-deck">
              <Button >Counterweighted Deck</Button>
            </Link>
          </ButtonGroup>

          </Box>
        </Stack>

        {props.children}

      </Box>
    </div>
  )
}