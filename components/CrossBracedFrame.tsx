import p5Types from 'p5' //Import this for typechecking and intellisense
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ResponsiveContainer } from 'recharts'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})

const constructionGray = 60
const textGray = 80
const formDiagramEllipseSize = 8
const forceDiagramEllipseSize = 5
const dashSize = 0.1

export default function HookesLaw() {
  const [editMode, setEditMode] = useState(0)
  const createCrossBracedFrame = useCallback(() => {
    return {
      p5: undefined as p5Types | undefined,
      mouseTrackingEnabled: true,
      editMode: 0,
      styleFormDiagram: false,
      forceDiagramScale: 100,
      formDiagramScale: 35,
      formDiagramOffset: [1 / 3, 3 / 4],
      forceDiagramOffset: [2 / 3, 3 / 4],
      unitLength: 5,
      baseLength: 5,
      moduleHeight: 5,
      zPhase: 0.75,
      loadUnit: 1,
      corners: [
        [0, 0],
        [5, 0],
        [5, 5],
        [0, 5],
      ],
      zPos: [2.5, 2.5],
      fitness: 0,
      forces: {
        l03: 0,
        l0z: 0,
        l3z: 0,
      },
      lengths: {
        l03: 0,
        l0z: 0,
        l3z: 0,
      },
      forceDiagram: {
        corner0: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        corner3: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        corner2: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        corner1: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
      },
      reactionVects: {
        corner0: undefined as p5Types.Vector | undefined,
        corner1: undefined as p5Types.Vector | undefined,
      },
      updateLengths() {
        const zLength = this.moduleHeight * this.zPhase
        const zDiff = this.moduleHeight - zLength

        this.lengths.l03 = this.moduleHeight
        this.lengths.l0z = Math.sqrt(this.baseLength * this.baseLength + zLength * zLength)
        this.lengths.l3z = Math.sqrt(this.baseLength * this.baseLength + zDiff * zDiff)
      },

      updateZPhaseBasedOnMouseY() {
        this.zPhase = (this.p5.height - this.p5.mouseY) / this.p5.height
      },
      updateBaseLengthBasedOnMouseX() {
        this.baseLength = ((this.p5.mouseX / this.p5.width) * 1.5 + 0.25) * this.unitLength
      },
      updateUnitLoadBasedOnMouseX() {
        this.loadUnit = (this.p5.mouseX / this.p5.width) * 2 + 0.25
      },
      updateForceDiagramOffset() {
        this.forceDiagramOffset = [
          this.p5?.mouseX / this.p5?.width,
          this.p5?.mouseY / this.p5?.height,
        ]
      },
      updateBasedOnMouse() {
        if (this.mouseTrackingEnabled) {
          switch (this.editMode) {
            case 0:
              this.updateZPhaseBasedOnMouseY()
              this.updateBaseLengthBasedOnMouseX()
              return
            case 1:
              this.updateUnitLoadBasedOnMouseX()
              return
            case 2:
              this.updateForceDiagramOffset()
              return
          }
        }
      },
      updateZPos() {
        this.zPos = [
          this.corners[0][0] + this.baseLength / 2,
          this.corners[0][1] + this.moduleHeight * this.zPhase,
        ]
      },
      updateCorners() {
        this.corners[1] = [this.corners[0][0] + this.baseLength, this.corners[0][1]]
        this.corners[2] = [
          this.corners[0][0] + this.baseLength,
          this.corners[0][1] + this.moduleHeight,
        ]
        this.corners[3] = [this.corners[0][0], this.corners[0][1] + this.moduleHeight]
      },
      updateForceMagnitudes() {
        const zLength = this.zPhase * this.moduleHeight
        const zDiff = this.moduleHeight - zLength
        const baseSquared = this.baseLength * this.baseLength
        this.forces.l03 = (this.loadUnit * zDiff) / this.baseLength
        this.forces.l3z =
          (-1 * this.loadUnit * Math.sqrt(baseSquared + zDiff * zDiff)) / this.baseLength
        this.forces.l0z =
          (this.loadUnit * Math.sqrt(baseSquared + zLength * zLength)) / this.baseLength
      },
      updateFitness() {
        this.fitness = Object.entries(this.forces)
          .map(([key, value]) => Math.abs(this.lengths[key] * value))
          .reduce((a, b) => a + b, 0)
      },

      evaluateMouseClickInFormDiagram() {
        if (!this.p5) return
        const x = (this.p5?.mouseX - this.p5?.width / 3) / this.formDiagramScale
        const y = (this.p5?.mouseY - this.p5?.height / 2) / this.formDiagramScale
        return [x, y]
      },
      solveCorner0ForceDiagram() {
        if (!this.p5) return
        const polarity = -1
        const l03Vect = this.p5.createVector(0, polarity * 1).setMag(Math.abs(this.forces.l03))
        const nextPoint = [l03Vect.x, l03Vect.y]
        const l0zMotionVect = this.p5.createVector(
          this.loadUnit / 2,
          (polarity * this.zPos[1] * this.loadUnit) / (2 * this.zPos[0])
        )
        const nextPos = l03Vect.add(l0zMotionVect)
        const nextNextPoint = [nextPos.x, nextPos.y]
        this.forceDiagram.corner0 = [[0, 0], nextPoint, nextNextPoint]
        this.reactionVects.corner0 = this.p5
          ?.createVector(nextNextPoint[0], nextNextPoint[1])
          .mult(2)
      },
      solveCorner3ForceDiagram() {
        if (!this.p5) return
        const pointB = [this.loadUnit / 2, 0]
        this.forceDiagram.corner3 = [
          this.forceDiagram.corner0[0],
          pointB,
          this.forceDiagram.corner0[1],
        ]
      },
      solveCorner2ForceDiagram() {
        if (!this.p5) return
        const pointC = [this.loadUnit, 0]
        this.forceDiagram.corner2 = [
          this.forceDiagram.corner3[1],
          pointC,
          [pointC[0], this.forceDiagram.corner0[1][1]],
        ]
      },
      solveCorner1ForceDiagram() {
        if (!this.p5) return
        this.forceDiagram.corner1 = [
          this.forceDiagram.corner2[2],
          this.forceDiagram.corner2[1],
          this.forceDiagram.corner0[2],
        ]
        this.reactionVects.corner1 = this.p5
          .createVector(
            this.forceDiagram.corner2[1][0] - this.forceDiagram.corner0[2][0],
            this.forceDiagram.corner2[1][1] - this.forceDiagram.corner0[2][1]
          )
          .mult(2)
      },
      update() {
        this.updateBasedOnMouse()
        this.updateLengths()
        this.updateZPos()
        this.updateCorners()
        this.updateForceMagnitudes()
        this.updateFitness()
        this.solveCorner0ForceDiagram()
        this.solveCorner3ForceDiagram()
        this.solveCorner2ForceDiagram()
        this.solveCorner1ForceDiagram()
        // this.updateLoadLine()
        // this.updateClosingLineSlope()
        // this.updateCoM()
        // this.updatePoleInForm()
        // this.updateTangentSlopes()
        // this.updatePoleInForce()
        // this.solveFormDiagram()
      },
      drawNodesInForm(stroke = 255) {
        this.p5?.noStroke()
        this.p5?.fill(stroke)
        this.corners.map(([x, y]) => {
          this.p5?.ellipse(
            x,
            -1 * y,
            formDiagramEllipseSize / this.formDiagramScale,
            formDiagramEllipseSize / this.formDiagramScale
          )
        })
        this.p5?.ellipse(
          this.zPos[0],
          -1 * this.zPos[1],
          formDiagramEllipseSize / this.formDiagramScale,
          formDiagramEllipseSize / this.formDiagramScale
        )
      },
      drawNodesInForce() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.forceDiagram.corner0.map(([x, y]) => {
          this.p5?.ellipse(
            x,
            y,
            forceDiagramEllipseSize / this.forceDiagramScale,
            forceDiagramEllipseSize / this.forceDiagramScale
          )
        })
        this.forceDiagram.corner3.map(([x, y]) => {
          this.p5?.ellipse(
            x,
            y,
            forceDiagramEllipseSize / this.forceDiagramScale,
            forceDiagramEllipseSize / this.forceDiagramScale
          )
        })
        this.forceDiagram.corner2.map(([x, y]) => {
          this.p5?.ellipse(
            x,
            y,
            forceDiagramEllipseSize / this.forceDiagramScale,
            forceDiagramEllipseSize / this.forceDiagramScale
          )
        })
        this.forceDiagram.corner1.map(([x, y]) => {
          this.p5?.ellipse(
            x,
            y,
            forceDiagramEllipseSize / this.forceDiagramScale,
            forceDiagramEllipseSize / this.forceDiagramScale
          )
        })
      },
      drawEdgesInForce() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1 / this.forceDiagramScale)
        this.forceDiagram.corner0.map(([x, y], i) => {
          this.p5?.line(
            x,
            y,
            this.forceDiagram.corner0[(i + 1) % 3][0],
            this.forceDiagram.corner0[(i + 1) % 3][1]
          )
        })
        this.forceDiagram.corner3.map(([x, y], i) => {
          this.p5?.line(
            x,
            y,
            this.forceDiagram.corner3[(i + 1) % 3][0],
            this.forceDiagram.corner3[(i + 1) % 3][1]
          )
        })
        this.forceDiagram.corner2.map(([x, y], i) => {
          this.p5?.line(
            x,
            y,
            this.forceDiagram.corner2[(i + 1) % 3][0],
            this.forceDiagram.corner2[(i + 1) % 3][1]
          )
        })
        this.forceDiagram.corner1.map(([x, y], i) => {
          this.p5?.line(
            x,
            y,
            this.forceDiagram.corner1[(i + 1) % 3][0],
            this.forceDiagram.corner1[(i + 1) % 3][1]
          )
        })
      },
      drawEdgesInForm(stroke = 255, style = false) {
        this.p5?.stroke(stroke)
        this.p5?.strokeWeight(1 / this.formDiagramScale)
        this.corners.map(([x, y], i) => {
          if (style) this.p5?.stroke(255 * (i % 2 === 0 ? 0 : 1), 0, 255 * (i % 2 === 0 ? 1 : 0))
          if (style)
            this.p5?.strokeWeight(
              (5 / this.formDiagramScale) *
                (i < 2 ? Math.abs(this.forces.l0z) : Math.abs(this.forces.l3z))
            )
          this.p5?.line(x, -1 * y, this.zPos[0], -1 * this.zPos[1])
        })
        if (style) this.p5?.strokeWeight((5 / this.formDiagramScale) * Math.abs(this.forces.l03))
        if (style) this.p5?.stroke(0, 0, 255)
        this.p5?.line(
          this.corners[0][0],
          -1 * this.corners[0][1],
          this.corners[3][0],
          -1 * this.corners[3][1]
        )
        if (style) this.p5?.stroke(255, 0, 0)
        this.p5?.line(
          this.corners[1][0],
          -1 * this.corners[1][1],
          this.corners[2][0],
          -1 * this.corners[2][1]
        )
      },
      drawOptimumInForm() {
        if (!this.p5) return
        this.p5?.stroke(constructionGray)
        this.p5?.strokeWeight(1 / this.formDiagramScale)
        const start = this.p5?.createVector(-0.25 * this.baseLength, -1 * this.moduleHeight * 0.75)
        while (start.x < this.baseLength * 1.25) {
          this.p5?.line(start?.x, start?.y, start?.x + dashSize, start?.y)
          start?.add(dashSize * 2, 0)
        }
      },
      drawCopiesOfForm() {
        Array(2)
          .fill(1)
          .forEach((_, i) => {
            this.p5?.push()
            this.p5?.translate(0, this.moduleHeight * (-1 * (i + 1)))
            this.drawEdgesInForm(constructionGray / 4)
            this.drawNodesInForm(constructionGray / 4)
            this.p5?.pop()
          })
      },
      drawNodeLabelsInForm() {
        this.p5?.fill(textGray)
        this.p5?.noStroke()
        this.p5?.textSize(12 / this.formDiagramScale)
        const labels = ['X', 'V', 'W', 'Y']
        this.corners.forEach(([x, y], i) => {
          this.p5?.text(
            labels[i],
            x - (8 * ([0, 3].includes(i) ? 2 : -1)) / this.formDiagramScale,
            -y - (8 * ([0, 1].includes(i) ? -2 : 0.5)) / this.formDiagramScale
          )
        })
      },
      drawBowsLabelsInForm() {
        this.p5?.fill(255)
        this.p5?.textSize(12 / this.formDiagramScale)
        this.p5?.noStroke()
        this.p5?.text('A', this.corners[0][0] - 20 / this.formDiagramScale, -this.corners[3][1] / 2)
        this.p5?.text(
          'D',
          (this.corners[0][0] + this.corners[1][0] + this.zPos[0]) / 3 - 4 / this.formDiagramScale,
          -(this.corners[0][1] + this.corners[1][1] + this.zPos[1]) / 3
        )
        this.p5?.text('C', this.corners[1][0] + 10 / this.formDiagramScale, -this.corners[2][1] / 2)
        this.p5?.text(
          'B',
          (this.corners[2][0] + this.corners[3][0] + this.zPos[0]) / 3 - 4 / this.formDiagramScale,
          -(this.corners[2][1] + this.corners[3][1] + this.zPos[1]) / 3
        )
        this.p5?.text(
          '1',
          (this.corners[0][0] + this.corners[3][0] + this.zPos[0]) / 3,
          -(this.corners[0][1] + this.corners[3][1] + this.zPos[1]) / 3
        )
        this.p5?.text(
          '2',
          (this.corners[1][0] + this.corners[2][0] + this.zPos[0]) / 3 - 10 / this.formDiagramScale,
          -(this.corners[1][1] + this.corners[2][1] + this.zPos[1]) / 3
        )
      },
      drawBowsLabelsInForce() {
        this.p5?.fill(255)
        this.p5?.textSize(12 / this.forceDiagramScale)
        this.p5?.noStroke()
        this.p5?.text(
          'a',
          this.forceDiagram.corner0[0][0] - 0.05,
          this.forceDiagram.corner0[0][1] + 0.15
        )
        this.p5?.text(
          '1',
          this.forceDiagram.corner0[1][0] - 0.05,
          this.forceDiagram.corner0[1][1] - 0.1
        )
        this.p5?.text(
          'd',
          this.forceDiagram.corner0[2][0] - 0.05,
          this.forceDiagram.corner0[2][1] - 0.1
        )
        this.p5?.text(
          'b',
          this.forceDiagram.corner3[1][0] - 0.05,
          this.forceDiagram.corner3[1][1] + 0.15
        )
        this.p5?.text(
          'b',
          this.forceDiagram.corner3[1][0] - 0.05,
          this.forceDiagram.corner3[1][1] + 0.15
        )
        this.p5?.text(
          'c',
          this.forceDiagram.corner2[1][0] - 0.05,
          this.forceDiagram.corner2[1][1] + 0.15
        )
        this.p5?.text(
          '2',
          this.forceDiagram.corner2[2][0] - 0.05,
          this.forceDiagram.corner2[2][1] - 0.1
        )
      },
      drawReactionsInForm() {
        const rxScaleFactor = -1
        const arrowHeadSize = 3
        this.p5?.stroke(constructionGray * 1.5)
        this.p5?.strokeWeight(1 / this.formDiagramScale)
        const corner0Rx = this.reactionVects.corner0?.div(rxScaleFactor)
        this.p5?.line(this.corners[0][0], this.corners[0][1], corner0Rx?.x, corner0Rx.y)
        this.p5?.stroke(constructionGray / 2.5)
        const start = this.p5?.createVector(corner0Rx?.x, corner0Rx.y)
        while (start.y > -this.corners[3][1]) {
          this.p5?.line(start?.x, start?.y, start?.x, start.y - dashSize)
          start?.add(this.p5.createVector(0, -dashSize * 2))
        }
        this.p5?.stroke(constructionGray * 1.5)
        const pointingCorner0Rx = corner0Rx?.copy().setMag(-0.35).copy()
        pointingCorner0Rx.rotate(this.p5?.PI / 3 - this.p5?.PI / 2)
        const pointingCorner0Rx2 = corner0Rx?.copy().setMag(-0.35).copy()
        pointingCorner0Rx2.rotate(-this.p5?.PI / 3 + this.p5.PI / 2)
        this.p5?.line(
          corner0Rx.x,
          corner0Rx.y,
          corner0Rx.x + pointingCorner0Rx?.x,
          corner0Rx.y + pointingCorner0Rx.y
        )
        this.p5?.line(
          corner0Rx.x,
          corner0Rx.y,
          corner0Rx.x + pointingCorner0Rx2?.x,
          corner0Rx.y + pointingCorner0Rx2.y
        )

        // Corner 1
        const corner1Rx = this.reactionVects.corner1?.div(rxScaleFactor)
        this.p5?.line(
          this.corners[1][0],
          this.corners[1][1],
          this.corners[1][0] - corner1Rx?.x,
          this.corners[1][1] - corner1Rx.y
        )
        this.p5?.stroke(constructionGray / 2.5)
        const start1 = this.p5?.createVector(this.corners[1][0] - corner1Rx?.x, -corner1Rx.y)
        while (start1.y > -this.corners[2][1]) {
          this.p5?.line(start1?.x, start1?.y, start1?.x, start1.y - dashSize)
          start1?.add(this.p5.createVector(0, -dashSize * 2))
        }
        this.p5?.stroke(constructionGray * 1.25)
        const pointingCorner1Rx = corner1Rx?.setMag(-0.35).copy()
        pointingCorner1Rx.rotate(this.p5?.PI / 3 - this.p5?.PI / 2)
        const pointingCorner1Rx2 = corner1Rx?.setMag(-0.35).copy()
        pointingCorner1Rx2.rotate(-this.p5?.PI / 3 - this.p5?.PI / 2)
        this.p5?.line(
          this.corners[1][0],
          this.corners[1][1],
          this.corners[1][0] + pointingCorner1Rx?.x,
          this.corners[1][1] + pointingCorner1Rx.y
        )
        this.p5?.line(
          this.corners[1][0],
          this.corners[1][1],
          this.corners[1][0] + pointingCorner1Rx2?.x,
          this.corners[1][1] + pointingCorner1Rx2.y
        )

        // Lateral Loads
        const corner3Rx = this.p5?.createVector(1, 0).setMag(this.loadUnit).div(rxScaleFactor)
        this.p5?.line(this.corners[3][0], -this.corners[3][1], corner3Rx.x, -this.corners[3][1])
        this.p5?.line(-0.2, -this.corners[3][1] + 0.1, -0.1, -this.corners[3][1])
        this.p5?.line(-0.2, -this.corners[3][1] - 0.1, -0.1, -this.corners[3][1])
        this.p5?.line(
          this.corners[2][0],
          -this.corners[2][1],
          -1 * corner3Rx.x + this.corners[2][0],
          -this.corners[2][1]
        )
        this.p5?.line(
          -1 * corner3Rx.x + this.corners[2][0] - 0.15,
          -this.corners[2][1] + 0.1,
          -1 * corner3Rx.x + this.corners[2][0],
          -this.corners[2][1]
        )
        this.p5?.line(
          -1 * corner3Rx.x + this.corners[2][0] - 0.15,
          -this.corners[2][1] - 0.1,
          -1 * corner3Rx.x + this.corners[2][0],
          -this.corners[2][1]
        )

        // Vertical Loads
      },
      drawFormDiagram() {
        this.p5?.push()
        this.p5?.translate(
          this.p5?.width * this.formDiagramOffset[0],
          this.p5?.height * this.formDiagramOffset[1]
        )
        this.p5?.scale(this.formDiagramScale)
        // this.drawNodeLabelsInForm()
        this.drawBowsLabelsInForm()
        this.drawOptimumInForm()
        this.drawCopiesOfForm()
        this.drawEdgesInForm(255, this.styleFormDiagram)
        this.drawNodesInForm()
        this.drawReactionsInForm()
        this.p5?.pop()
      },
      drawForceDiagram() {
        this.p5?.push()
        this.p5?.translate(
          this.p5?.width * this.forceDiagramOffset[0],
          this.p5?.height * this.forceDiagramOffset[1]
        )
        this.p5?.scale(this.forceDiagramScale)
        this.drawNodesInForce()
        this.drawEdgesInForce()
        this.drawBowsLabelsInForce()
        // this.drawLoadPoints()
        // this.drawLoadLine()
        // this.drawPoleInForce()
        // this.drawTensionForces()
        // this.drawMirrorPoleInForce()
        // this.drawMirrorCompressionForces()
        this.p5?.pop()
      },
    }
  }, [])

  const crossBracedFrame = useRef(createCrossBracedFrame())

  const [styleFormDiagram, setStyleFormDiagram] = useState(false)

  const toggleStyleFormDiagram = useCallback(() => {
    setStyleFormDiagram((prev) => !prev)
    crossBracedFrame.current.styleFormDiagram = !crossBracedFrame.current.styleFormDiagram
  }, [setStyleFormDiagram])

  const setEditModeWithRef = useCallback(
    (e, val) => {
      setEditMode(val)
      crossBracedFrame.current.editMode = val
    },
    [setEditMode]
  )

  // TODO: should all of the setups usecallback?
  const setup = useCallback((p5: p5Types, canvasParentRef: Element) => {
    const canv = p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef)
    canv.position(-1, -1)
    canv.style('z-index', -2)
    crossBracedFrame.current.p5 = p5
  }, [])

  return (
    <Box sx={{ mt: '1rem' }}>
      <FormControlLabel
        control={<Checkbox onClick={toggleStyleFormDiagram} value={styleFormDiagram} />}
        label={'Show thickness and force polarity [blue: T]'}
      />
      <Box>
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
      </Typography>

      <Sketch
        setup={setup}
        draw={(p5: p5Types) => {
          p5.background(0)
          crossBracedFrame.current.update()
          crossBracedFrame.current.drawForceDiagram()
          crossBracedFrame.current.drawFormDiagram()
        }}
        mouseClicked={(p5: p5Types) => {
          crossBracedFrame.current.mouseTrackingEnabled =
            !crossBracedFrame.current.mouseTrackingEnabled
        }}
        windowResized={(p5: p5Types) => {
          p5.resizeCanvas(p5.windowWidth, p5.windowHeight)
        }}
      />
    </Box>
  )
}
