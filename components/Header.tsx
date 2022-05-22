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

        <Stack direction="row" sx={{justifyContent: "space-between"}}>
          <Typography variant="h2">Interactive Graphic Statics</Typography>
          <ButtonGroup variant="outlined">
            <Link href="/">
              <Button>Home</Button>
            </Link>
            <Link href="/counterweighted-deck">
              <Button >Counterweighted Cable-Stayed Deck</Button>
            </Link>
          </ButtonGroup>
        </Stack>

        {props.children}

      </Box>
    </div>
  )
}