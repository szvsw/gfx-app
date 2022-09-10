import p5Types from 'p5' //Import this for typechecking and intellisense
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Grid from '@mui/material/Grid'
import { distance, m, midpoint, solveIx, solveIxM } from '../lib/utils'

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})

const materials = {
  Steel: {
    rho: 490, // pcf
    sigma: 25, // ksi
    carbonCoeff: 20, // lbsCO2eq/lb
  },
  Wood: {
    rho: 490, // pcf
    sigma: 25, // ksi
    carbonCoeff: 20, // lbsCO2eq/lb
  },
}
const constructionGray = 60
const textGray = 80
const formDiagramEllipseSize = 8
const forceDiagramEllipseSize = 5
const dashSize = 0.1

export default function HookesLaw() {
  const [editMode, setEditMode] = useState(0)
  const createFanTruss = useCallback(() => {
    return {
      p5: undefined as p5Types | undefined,
      tensionSigma: 25, // ksi
      tensionRho: 490, // pcf
      tensionCarbonCoeff: 20, // lbsCO2eq/lb
      compressionSigma: 25, // ksi
      compressionRho: 490, // pcf
      compressionCarbonCoeff: 20, // lbsCO2eq/lb
      mouseTrackingEnabled: true,
      editMode: 0,
      styleFormDiagram: false,
      forceDiagramScale: 10,
      formDiagramScale: 10,
      formDiagramOffset: [1 / 2, 1 / 2],
      forceDiagramOffset: [7 / 8, 1 / 2],
      loadUnit: 20,
      span: 30,
      chordBaseWidth: 10,
      mainNodeZ: 10,
      chordZ: -10,
      mainNode: [0, 10],
      chordLocations: [
        [-15, 0],
        [-5, -10],
        [5, -10],
        [15, 0],
      ],
      mainSlopes: [0, 0, 0, 0],
      chordSlopes: [0, 0, 0],
      externalNodesInForce: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      internalNodesInForce: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      chordForces: [0, 0, 0],
      compressionForces: [0, 0, 0, 0],
      updateMainNodeLocation() {
        this.mainNode = [0, this.mainNodeZ]
      },
      updateChordLocations() {
        this.chordLocations[0] = [-this.span / 2, 0]
        this.chordLocations[1] = [-this.chordBaseWidth / 2, this.chordZ]
        this.chordLocations[2] = [this.chordBaseWidth / 2, this.chordZ]
        this.chordLocations[3] = [this.span / 2, 0]
      },
      updateMainSlopes() {
        this.chordLocations.forEach(([x, y], i) => {
          this.mainSlopes[i] = m(x, y, this.mainNode[0], this.mainNode[1])
        })
      },
      updateChordSlopes() {
        this.chordLocations.forEach(([x, y], i) => {
          if (i < this.chordLocations.length - 1) {
            this.chordSlopes[i] = m(
              x,
              y,
              this.chordLocations[i + 1][0],
              this.chordLocations[i + 1][1]
            )
          }
        })
      },
      solveForceDiagramTopHalf() {
        const bowCLocation = [0, 0]
        const bowALocation = [0, this.loadUnit / 2]
        const bowBLocation = [0, -this.loadUnit / 2]
        this.externalNodesInForce = [bowALocation, bowBLocation, bowCLocation]

        const bow1Location = solveIxM(
          bowALocation,
          this.mainSlopes[0],
          bowCLocation,
          this.chordSlopes[0]
        )
        // This should be easily abstractable...
        const bow2Location = solveIxM(
          bow1Location,
          this.mainSlopes[1],
          bowCLocation,
          this.chordSlopes[1]
        )
        const bow3Location = solveIxM(
          bow2Location,
          this.mainSlopes[2],
          bowCLocation,
          this.chordSlopes[2]
        )

        this.internalNodesInForce = [bow1Location, bow2Location, bow3Location]
      },
      updateForceMagnitudes() {
        this.chordForces = this.internalNodesInForce.map(([x, y]) =>
          distance(x, y, this.externalNodesInForce[this.externalNodesInForce.length - 1])
        )
        const sortedNodes = this.internalNodesInForce.slice()
        sortedNodes.push(this.externalNodesInForce[1])
        sortedNodes.reverse()
        sortedNodes.push(this.externalNodesInForce[0])
        sortedNodes.reverse()
        this.compressionForces = Array(this.chordLocations.length)
          .fill(0)
          .map((_, i) =>
            distance(
              sortedNodes[i][0],
              sortedNodes[i][1],
              sortedNodes[i + 1][0],
              sortedNodes[i + 1][1]
            )
          )
      },
      updateEmbodiedCarbon() {
        const tensionAreas = this.chordForces.map((force) => force / this.tensionSigma) // sq. in
        const tensionRadii = tensionAreas.map((area) => Math.sqrt(area / Math.PI)) // in
        const tensionLengths = this.chordLocations
          .slice(0, this.chordLocations.length - 1)
          .map(
            ([x, y], i) =>
              distance(x, y, this.chordLocations[i + 1][0], this.chordLocations[i + 1][1]) * 12
          ) // inches
        const tensionVolumes = tensionAreas.map((area, i) => area * tensionLengths[i]) // cub. in
        const tensionMasses = tensionVolumes.map((vol) => (this.tensionRho * vol) / 12 / 12 / 12) // lbs
        const tensionCarbon = tensionMasses.map((mass) => mass * this.tensionCarbonCoeff) // lbCO2eq

        const compressionAreas = this.compressionForces.map(
          (force) => force / this.compressionSigma
        ) // sq. in
        const compressionRadii = compressionAreas.map((area) => Math.sqrt(area / Math.PI)) // in
        const compressionLengths = this.chordLocations.map(
          ([x, y], i) => distance(x, y, this.mainNode[0], this.mainNode[1]) * 12
        ) // inches
        const compressionVolumes = compressionAreas.map((area, i) => area * compressionLengths[i]) // cub. in
        const compressionMasses = compressionVolumes.map(
          (vol) => (this.compressionRho * vol) / 12 / 12 / 12
        ) // lbs
        const compressionCarbon = compressionMasses.map(
          (mass) => mass * this.compressionCarbonCoeff
        ) // lbCO2eq
      },
      update() {
        this.updateMainNodeLocation()
        this.updateChordLocations()
        this.updateMainSlopes()
        this.updateChordSlopes()
        this.solveForceDiagramTopHalf()
        this.updateForceMagnitudes()
      },
      drawNodesInForm() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.ellipse(
          this.mainNode[0],
          this.mainNode[1],
          formDiagramEllipseSize / this.formDiagramScale,
          formDiagramEllipseSize / this.formDiagramScale
        )
        this.chordLocations.forEach(([x, y]) => {
          this.p5?.ellipse(
            x,
            y,
            formDiagramEllipseSize / this.formDiagramScale,
            formDiagramEllipseSize / this.formDiagramScale
          )
        })
      },
      drawEdgesInForm() {
        this.p5?.noFill()
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1 / this.formDiagramScale)
        this.chordLocations.forEach(([x, y], i) => {
          if (this.styleFormDiagram) {
            this.p5?.stroke(255, 0, 0)
            this.p5?.strokeWeight(this.compressionForces[i] / this.formDiagramScale)
          }
          this.p5?.line(x, y, this.mainNode[0], this.mainNode[1])
          if (this.styleFormDiagram) {
            this.p5?.stroke(0, 0, 255)
            this.p5?.strokeWeight(this.chordForces[i] / this.formDiagramScale)
          }
          if (i < this.chordLocations.length - 1) {
            this.p5?.line(x, y, this.chordLocations[i + 1][0], this.chordLocations[i + 1][1])
          }
        })
      },
      drawReactionsInForm() {
        const baseRxLengthScalar = 2.5
        this.p5?.noFill()
        this.p5?.stroke(constructionGray * 1.25)
        this.p5?.strokeWeight(1 / this.formDiagramScale)
        this.p5?.line(0, this.mainNodeZ, 0, this.mainNodeZ + this.loadUnit / baseRxLengthScalar)
        this.p5?.line(0, this.mainNodeZ, 1, this.mainNodeZ + 1.5)
        this.p5?.line(0, this.mainNodeZ, -1, this.mainNodeZ + 1.5)

        this.p5?.line(
          this.chordLocations[0][0],
          0,
          this.chordLocations[0][0],
          -this.loadUnit / (2 * baseRxLengthScalar)
        )
        this.p5?.line(this.chordLocations[0][0], 0, this.chordLocations[0][0] - 1, -1.5)
        this.p5?.line(this.chordLocations[0][0], 0, this.chordLocations[0][0] + 1, -1.5)

        this.p5?.line(
          this.chordLocations[this.chordLocations.length - 1][0],
          0,
          this.chordLocations[this.chordLocations.length - 1][0],
          -this.loadUnit / (2 * baseRxLengthScalar)
        )
        this.p5?.line(
          this.chordLocations[this.chordLocations.length - 1][0],
          0,
          this.chordLocations[this.chordLocations.length - 1][0] - 1,
          -1.5
        )
        this.p5?.line(
          this.chordLocations[this.chordLocations.length - 1][0],
          0,
          this.chordLocations[this.chordLocations.length - 1][0] + 1,
          -1.5
        )
      },
      drawBowsInForm() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.textSize(12 / this.formDiagramScale)
        this.p5?.push()
        this.p5?.scale(1, -1)
        this.chordLocations.forEach((U, i) => {
          if (i === 0) {
            const mp = midpoint(U, this.mainNode)
            this.p5?.text('A', mp[0], -mp[1] - 5)
          }
          if (i === 1) {
            const mp = midpoint(U, this.chordLocations[i + 1])
            this.p5?.text('C', mp[0], -mp[1] + 5)
          }
          if (i === this.chordLocations.length - 1) {
            const mp = midpoint(U, this.mainNode)
            this.p5?.text('B', mp[0], -mp[1] - 5)
          }
          if (i < this.chordLocations.length - 1) {
            const [nextX, nextY] = [this.chordLocations[i + 1][0], this.chordLocations[i + 1][1]]
            const avgX = (U[0] + nextX + this.mainNode[0]) / 3
            const avgY = (U[1] + nextY + this.mainNode[1]) / 3
            this.p5?.text(i + 1, avgX, -avgY)
          }
        })
        this.p5?.pop()
      },
      drawBowsInForce() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.textSize(12 / this.forceDiagramScale)
        this.externalNodesInForce.forEach(([x, y], i) => {
          const char = String.fromCharCode('a'.charCodeAt(0) + i)
          this.p5?.push()
          this.p5?.scale(1, -1)
          this.p5?.text(char, x + 0.5, -y)
          this.p5?.pop()
        })
        this.internalNodesInForce.forEach(([x, y], i) => {
          this.p5?.push()
          this.p5?.scale(1, -1)
          this.p5?.text(i + 1, x - 1.5, -y)
          this.p5?.pop()
        })
      },
      drawNodesInForce() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.internalNodesInForce.concat(this.externalNodesInForce).forEach(([x, y]) => {
          this.p5?.ellipse(x, y, forceDiagramEllipseSize / this.forceDiagramScale)
        })
      },
      drawEdgesInForce() {
        this.p5?.noFill()
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1 / this.forceDiagramScale)
        this.internalNodesInForce.concat(this.externalNodesInForce).forEach(([x, y]) => {
          this.p5?.line(x, y, this.externalNodesInForce[2][0], this.externalNodesInForce[2][1])
        })
        const sortedNodes = this.internalNodesInForce.slice()
        sortedNodes.push(this.externalNodesInForce[1])
        sortedNodes.reverse()
        sortedNodes.push(this.externalNodesInForce[0])
        sortedNodes.reverse()
        sortedNodes.forEach(([x, y], i) => {
          if (i < sortedNodes.length - 1) {
            this.p5?.line(x, y, sortedNodes[i + 1][0], sortedNodes[i + 1][1])
          }
        })
      },
      drawForceDiagram() {
        this.p5?.push()
        this.p5?.translate(
          this.p5?.width * this.forceDiagramOffset[0],
          this.p5?.height * this.forceDiagramOffset[1]
        )
        this.p5?.scale(this.forceDiagramScale)
        this.p5?.scale(1, -1)
        this.drawEdgesInForce()
        this.drawNodesInForce()
        this.drawBowsInForce()
        this.p5?.pop()
      },
      drawFormDiagram() {
        this.p5?.push()
        this.p5?.translate(
          this.p5?.width * this.formDiagramOffset[0],
          this.p5?.height * this.formDiagramOffset[1]
        )
        this.p5?.scale(this.formDiagramScale)
        this.p5?.scale(1, -1)
        this.drawReactionsInForm()
        this.drawEdgesInForm()
        this.drawNodesInForm()
        this.drawBowsInForm()

        this.p5?.pop()
      },
    }
  }, [])

  const fanTruss = useRef(createFanTruss())

  const [styleFormDiagram, setStyleFormDiagram] = useState(false)

  const toggleStyleFormDiagram = useCallback(() => {
    setStyleFormDiagram((prev) => !prev)
    fanTruss.current.styleFormDiagram = !fanTruss.current.styleFormDiagram
  }, [setStyleFormDiagram])

  const setEditModeWithRef = useCallback(
    (e, val) => {
      setEditMode(val)
      fanTruss.current.editMode = val
    },
    [setEditMode]
  )

  // TODO: should all of the setups usecallback?
  const setup = useCallback((p5: p5Types, canvasParentRef: Element) => {
    const canv = p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef)
    canv.position(-1, -1)
    canv.style('z-index', -2)
    fanTruss.current.p5 = p5
  }, [])

  return (
    <Box sx={{ mt: '2rem' }}>
      <Grid container spacing={3} justifyContent="space-between">
        <Grid container item xs={3} spacing={2} direction="column">
          <Grid item>
            <Typography gutterBottom>Load (kips)</Typography>
            <Slider
              size="small"
              min={5}
              max={50}
              step={0.1}
              defaultValue={20}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                fanTruss.current.loadUnit = Number(v)
              }}
            />
          </Grid>
          <Grid item>
            <Typography gutterBottom>Span (ft)</Typography>
            <Slider
              size="small"
              min={10}
              max={50}
              step={0.1}
              defaultValue={30}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                fanTruss.current.span = Number(v)
              }}
            />
          </Grid>
          <Grid item>
            <Typography gutterBottom>Main Node Position (y-axis, ft)</Typography>
            <Slider
              size="small"
              min={-20}
              max={20}
              step={0.1}
              defaultValue={10}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                fanTruss.current.mainNodeZ = Number(v)
              }}
            />
          </Grid>
          <Grid item>
            <Typography gutterBottom>Chord Middle Width (ft)</Typography>
            <Slider
              size="small"
              min={1}
              max={50}
              step={0.1}
              defaultValue={10}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                fanTruss.current.chordBaseWidth = Number(v)
              }}
            />
          </Grid>
          <Grid item>
            <Typography gutterBottom>Chord Middle Position (y-axis, ft)</Typography>
            <Slider
              size="small"
              min={-20}
              max={0}
              step={0.1}
              defaultValue={-10}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                fanTruss.current.chordZ = Number(v)
              }}
            />
          </Grid>
          <Grid item>
            <TextField
              defaultValue="Steel"
              fullWidth
              size="small"
              select
              label={'Tension Material'}
            >
              {Object.entries(materials).map(([mat, { carbonCoeff, sigma }], i) => (
                <MenuItem value={mat} key={`${mat}-tension`}>
                  {mat} [{sigma} ksi] [{carbonCoeff} lbCO2eq/lb]{' '}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              fullWidth
              defaultValue="Wood"
              size="small"
              select
              label={'Compression Material'}
            >
              {Object.entries(materials).map(([mat, { carbonCoeff, sigma }], i) => (
                <MenuItem value={mat} key={`${mat}-compression`}>
                  {mat} [{sigma} ksi] [{carbonCoeff} lbCO2eq/lb]{' '}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Grid container item xs={4} spacing={2} direction="column">
          <Grid item>
            <FormControlLabel
              control={<Checkbox onClick={toggleStyleFormDiagram} value={styleFormDiagram} />}
              label={'Show thickness and force polarity [blue: T]'}
            />
          </Grid>
        </Grid>
      </Grid>

      {/*       <Box>
        <Typography variant="overline">
          Select interactivity mode. Click mouse to lock/unlock interaction.
        </Typography>
      </Box>
      <Grid container alignItems="center" spacing={2} sx={{ mb: '1rem' }}>
        <Grid item>
          <ToggleButtonGroup value={editMode} onChange={setEditModeWithRef} exclusive>
            <ToggleButton value={0}>Geometry</ToggleButton>
            <ToggleButton value={1}>Load</ToggleButton>
            <ToggleButton value={2}>Layout</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        <Grid item>
          {editMode == 0 && (
            <Box>
              <Box>
                <Typography variant="overline">Mouse X: Module Width</Typography>
              </Box>
              <Box>
                <Typography variant="overline">Mouse Y: Central Node Height</Typography>
              </Box>
            </Box>
          )}
          {editMode == 1 && (
            <Box>
              <Typography variant="overline">Mouse X: External Lateral Load Magnitude</Typography>
            </Box>
          )}
          {editMode == 2 && (
            <Box>
              <Typography variant="overline">Move Force Diagram to Mouse.</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
      <Typography variant="body2" sx={{ width: '50%' }}>
        Form and force diagram labeled with Bows' Notation for a Cross-Braced Frame. Horizontal
        dotted line at three-quarters of the module height represents the location of the central
        node where the volume of material for a maximally stressed system will be minimized.
      </Typography> */}

      <Sketch
        setup={setup}
        draw={(p5: p5Types) => {
          p5.background(0)
          fanTruss.current.update()
          fanTruss.current.drawForceDiagram()
          fanTruss.current.drawFormDiagram()
        }}
        mouseClicked={(p5: p5Types) => {
          fanTruss.current.mouseTrackingEnabled = !fanTruss.current.mouseTrackingEnabled
        }}
        windowResized={(p5: p5Types) => {
          p5.resizeCanvas(p5.windowWidth, p5.windowHeight)
        }}
      />
    </Box>
  )
}
