import React, { ReactNode, useCallback, useState } from 'react'
import Head from 'next/head'
import Button from '@mui/material/Button'
import Link from 'next/link'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Popover from '@mui/material/Popover'
import Box from '@mui/material/Box'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import MenuIcon from '@mui/icons-material/Menu'
import { Divider } from '@mui/material'

type Props = {
  children: ReactNode
}

export const Header: React.FC<Props> = (props) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = useCallback(
    (event) => {
      setAnchorEl(event.currentTarget)
    },
    [setAnchorEl]
  )

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [setAnchorEl])
  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  return (
    <div>
      <Head>
        <title>Interactive Graphic Statics</title>
      </Head>

      <Box sx={{ p: '2rem' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack>
            <Link href="/">
              <Button variant="text">
                <Typography variant="h2">Interactive Graphic Statics</Typography>
                <Divider />
              </Button>
            </Link>
            <Divider />
          </Stack>

          <Box>
            <Button
              aria-describedby={id}
              variant="contained"
              onClick={handleClick}
              endIcon={<MenuIcon />}
            >
              Topology
            </Button>
            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <MenuList>
                <MenuItem>
                  <Link href="/equilibrium-node">
                    <Button>Equilibrium Node</Button>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/hookes-law">
                    <Button>Hooke's Law</Button>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/counterweighted-deck">
                    <Button>Counterweighted Deck</Button>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/cross-braced-frame">
                    <Button>Cross Braced Frame</Button>
                  </Link>
                </MenuItem>
              </MenuList>
            </Popover>
            {/* <ButtonGroup size="small" variant="outlined">
              <Link href="/equilibrium-node">
                <Button >Equilibrium Node</Button>
              </Link>
              <Link href="/hookes-law">
                <Button >Hooke's Law</Button>
              </Link>
              <Link href="/counterweighted-deck">
                <Button >Counterweighted Deck</Button>
              </Link>
            </ButtonGroup> */}
          </Box>
        </Stack>

        {props.children}
      </Box>
    </div>
  )
}
