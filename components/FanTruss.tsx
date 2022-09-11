import p5Types from 'p5' //Import this for typechecking and intellisense
import dynamic from 'next/dynamic'
import { useCallback, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import { distance, m, midpoint, solveIxM } from '../lib/utils'

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})

const materials = {
  Steel: {
    rho: 0.284, // pci
    sigmaT: 25, // ksi
    sigmaC: 25, // ksi
    sigmaB: 24,
    E: 29000, // ksi
    carbonCoeff: 1.23, // lbsCO2eq/lb
  },
  Wood: {
    rho: 0.019, // pci
    sigmaC: 1.7, // ksi
    sigmaT: 1.0, // ksi
    sigmaB: 1.5, // ksi
    E: 1900, // ksi
    carbonCoeff: 0.42, // lbsCO2eq/lb
  },
}
const constructionGray = 60
const textGray = 80
const formDiagramEllipseSize = 8
const forceDiagramEllipseSize = 5
const dashSize = 0.1

export default function HookesLaw() {
  const [editMode, setEditMode] = useState(0)
  const [chordZ, setChordZ] = useState(-10)
  const [mainNodeZ, setMainNodeZ] = useState(10)
  const [chordBaseWidth, setChordBaseWidth] = useState(10)
  const createFanTruss = useCallback(() => {
    return {
      p5: undefined as p5Types | undefined,
      tensionMat: {
        ...materials.Steel,
      },
      compressionMat: {
        ...materials.Wood,
      },
      runOptimizer: false,
      globalBests: [99999, 99999, 99999],
      genes: Array(20).fill({ chordBaseWidth: 10, mainNodeZ: 10, chordZ: -10 }),
      mouseTrackingEnabled: true,
      editMode: 0,
      styleFormDiagram: false,
      showForcesAndLengths: false,
      forceDiagramScale: 10,
      formDiagramScale: 10,
      formDiagramOffset: [1 / 2, 1 / 2],
      forceDiagramOffset: [7 / 8, 1 / 2],
      loadUnit: 20,
      span: 30,
      chordBaseWidth: chordBaseWidth,
      mainNodeZ: mainNodeZ,
      chordZ: chordZ,
      mainNode: [0, 10],
      chordLocations: [
        [-15, 0],
        [-5, -10],
        [5, -10],
        [15, 0],
      ],
      mainSlopes: [0, 0, 0, 0],
      chordSlopes: [0, 0, 0],
      chordLengths: [0, 0, 0],
      mainLengths: [0, 0, 0, 0],
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
      chordMasses: [0, 0, 0],
      mainMasses: [0, 0, 0, 0],
      chordCarbon: [0, 0, 0],
      mainCarbon: [0, 0, 0, 0],
      totalMass: 0,
      totalCarbon: 0,
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
      updateElementLengths() {
        this.chordLocations.slice(0, this.chordLocations.length - 1).forEach(([x, y], i) => {
          this.chordLengths[i] = distance(
            x,
            y,
            this.chordLocations[i + 1][0],
            this.chordLocations[i + 1][1]
          )
        })
        this.chordLocations.forEach(([x, y], i) => {
          this.mainLengths[i] = distance(x, y, this.mainNode[0], this.mainNode[1])
        })
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
        ) as number[]
        // This should be easily abstractable...
        const bow2Location = solveIxM(
          bow1Location,
          this.mainSlopes[1],
          bowCLocation,
          this.chordSlopes[1]
        ) as number[]
        const bow3Location = solveIxM(
          bow2Location,
          this.mainSlopes[2],
          bowCLocation,
          this.chordSlopes[2]
        ) as number[]

        this.internalNodesInForce = [bow1Location, bow2Location, bow3Location]
      },
      updateForceMagnitudes() {
        this.chordForces = this.internalNodesInForce.map(([x, y]) =>
          distance(
            x,
            y,
            this.externalNodesInForce[this.externalNodesInForce.length - 1][0],
            this.externalNodesInForce[this.externalNodesInForce.length - 1][1]
          )
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
        const tensionAreas = this.chordForces.map((force) => force / this.tensionMat.sigmaT) // sq. in
        // const tensionRadii = tensionAreas.map((area) => Math.sqrt(area / Math.PI)) // in
        const tensionLengths = this.chordLengths.map((l) => l * 12) // in
        const tensionVolumes = tensionAreas.map((area, i) => area * tensionLengths[i]) // cub. in
        const tensionMasses = tensionVolumes.map((vol) => this.tensionMat.rho * vol) // lbs
        const tensionCarbon = tensionMasses.map((mass) => mass * this.tensionMat.carbonCoeff) // lbCO2eq

        // safety factor of 3
        // 3*F = PI^2*E*I / (kL^2), k = 1, I = pi/4 * r^4
        // 3*F*k*L^2 / (Pi^2*E) = PI/4 * r^4
        // (4*3*F*k*L^2 / (PI*E))^(1/2) = PI*r^2 = A
        const compressionLengths = this.mainLengths.map((l) => l * 12) // inches
        const compressionBucklingAreas = this.compressionForces.map(
          (f, i) =>
            ((4 * 3 * f * 1 * compressionLengths[i] ** 2) / (Math.PI * this.compressionMat.E)) **
            0.5
        )

        const compressionStrengthAreas = this.compressionForces.map(
          (force) => force / this.compressionMat.sigmaC
        ) // sq. in
        const compressionAreas = compressionBucklingAreas.map((a, i) =>
          Math.max(a, compressionStrengthAreas[i])
        )
        // const compressionRadii = compressionAreas.map((area) => Math.sqrt(area / Math.PI)) // in
        const compressionVolumes = compressionAreas.map((area, i) => area * compressionLengths[i]) // cub. in
        const compressionMasses = compressionVolumes.map((vol) => this.compressionMat.rho * vol) // lbs
        const compressionCarbon = compressionMasses.map(
          (mass) => mass * this.compressionMat.carbonCoeff
        ) // lbCO2eq
        this.chordMasses = tensionMasses
        this.chordCarbon = tensionCarbon
        this.mainMasses = compressionMasses
        this.mainCarbon = compressionCarbon
        this.totalMass = compressionMasses.concat(tensionMasses).reduce((a, b) => a + b, 0)
        this.totalCarbon = compressionCarbon.concat(tensionCarbon).reduce((a, b) => a + b, 0)
        // console.log('tension lengths', tensionLengths)
        // console.log('tension forces', this.chordForces)
        // console.log('tension areas', tensionAreas)
        // console.log('tension radii', tensionRadii)
        // console.log('tension volumes', tensionVolumes)
        // console.log('tension masses', tensionMasses)
        // console.log('tension carbon', tensionCarbon)
        // console.log('compression lengths', compressionLengths)
        // console.log('compression forces', this.compressionForces)
        // console.log('compression stress areas', compressionStrengthAreas)
        // console.log('compression buckling areas', compressionBucklingAreas)
        // console.log('compression areas', compressionAreas)
        // console.log('compression mass', compressionMasses)
        // console.log('compression carbon', compressionCarbon)
        // console.log('structural mass', structuralMass)
        // console.log('structural carbon', structuralCarbon)
      },
      update() {
        this.updateMainNodeLocation()
        this.updateChordLocations()
        this.updateElementLengths()
        this.updateMainSlopes()
        this.updateChordSlopes()
        this.solveForceDiagramTopHalf()
        this.updateForceMagnitudes()
        this.updateEmbodiedCarbon()
      },
      createGene() {
        return {
          chordBaseWidth: Math.random() * 20 + 0.1,
          mainNodeZ: Math.random() * 20 - 10,
          chordZ: Math.random() * -15 - 0.1,
        }
      },
      initializeGenes() {
        this.genes = this.genes.map((_) => this.createGene())
      },
      mutateGenes() {
        const mutationProbability = 0.25
        const elitismPercent = 0.05
        this.genes = this.genes.map((gene, i) => {
          if (i / this.genes.length < elitismPercent) return gene
          if (Math.random() < mutationProbability)
            gene.chordZ = Math.max(Math.min(gene.chordZ + Math.random() * 2 - 1, 0), -15)
          if (Math.random() < mutationProbability)
            gene.mainNodeZ = Math.max(Math.min(gene.mainNodeZ + Math.random() * 2 - 1, 15), 4)
          if (Math.random() < mutationProbability)
            gene.chordBaseWidth = Math.max(
              Math.min(gene.chordBaseWidth + Math.random() * 2 - 1, 25),
              0.1
            )
          return gene
        })
      },
      introduceExternalGenes() {
        const replacementRate = 0.25
        const elitismPercent = 0.25
        this.genes = this.genes.map((gene, i) => {
          if (i / this.genes.length < elitismPercent) return gene // elitism
          if (Math.random() < replacementRate) return this.createGene()
          return gene
        })
      },
      optimize() {
        if (!this.runOptimizer) return false
        const fitness = this.genes.map((_) => 0)
        this.genes.forEach((gene, i) => {
          Object.entries(gene).forEach(([key, val]) => (this[key] = val))
          this.update()
          fitness[i] = this.totalCarbon
          let j = 0
          while (j < this.globalBests.length) {
            if (fitness[i] < this.globalBests[j]) {
              this.globalBests[j] = fitness[i]
              break
            }
            j = j + 1
          }
          this.globalBests.sort((a, b) => a - b)
        })
        const genesWithFitness = this.genes.map((gene, i) => [gene, fitness[i]])
        genesWithFitness.sort(([_, fitness1], [__, fitness2]) => fitness1 - fitness2)
        if (this.p5?.frameCount % 60 === 0) console.log(genesWithFitness)
        const elitismPercent = 1
        this.genes = genesWithFitness.map(([gene, _], i) => {
          if (i / this.genes.length < elitismPercent) {
            return gene
          }
          return this.createGene()
        })
        Object.entries(this.genes[0]).forEach(([key, val]) => (this[key] = val))
        this.update()
        this.mutateGenes()
        this.introduceExternalGenes()
        genesWithFitness.forEach(([gene, fitness], i) => {
          if (this.globalBests.some((val) => val >= fitness)) {
            this.genes[i] = gene
          }
        })
        if (this.p5?.frameCount % 30 === 0) {
          setChordBaseWidth(Math.round(this.chordBaseWidth * 10) / 10)
          setChordZ(Math.round(10 * this.chordZ) / 10)
          setMainNodeZ(Math.round(10 * this.mainNodeZ) / 10)
        }
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
      drawForceValuesInForm() {
        if (!this.showForcesAndLengths) return
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.textSize(12)
        this.p5?.push()
        this.p5?.scale(1 / this.formDiagramScale, -1 / this.formDiagramScale)
        this.chordForces.forEach((f, i) => {
          const loc = midpoint(this.chordLocations[i], this.chordLocations[i + 1])
          this.p5?.text(
            `${Math.round(f)}k (T)`,
            loc[0] * this.formDiagramScale,
            -loc[1] * this.formDiagramScale
          )
        })
        this.compressionForces.forEach((f, i) => {
          const loc = midpoint(this.chordLocations[i], this.mainNode)
          this.p5?.text(
            `${Math.round(f)}k (C)`,
            loc[0] * this.formDiagramScale,
            -loc[1] * this.formDiagramScale
          )
        })

        this.p5?.pop()
      },
      drawLengthsInForm() {
        if (!this.showForcesAndLengths) return
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.textSize(12)
        this.p5?.push()
        this.p5?.scale(1 / this.formDiagramScale, -1 / this.formDiagramScale)
        this.chordLengths.forEach((l, i) => {
          const loc = midpoint(this.chordLocations[i], this.chordLocations[i + 1])
          this.p5?.text(
            `${Math.round(l)}ft`,
            loc[0] * this.formDiagramScale,
            (-loc[1] + 2) * this.formDiagramScale
          )
        })
        this.mainLengths.forEach((l, i) => {
          const loc = midpoint(this.chordLocations[i], this.mainNode)
          this.p5?.text(
            `${Math.round(l)}ft`,
            loc[0] * this.formDiagramScale,
            (-loc[1] + 2) * this.formDiagramScale
          )
        })

        this.p5?.pop()
      },
      drawECandMassInForm() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.textSize(12)
        this.p5?.push()
        this.p5?.scale(1 / this.formDiagramScale, -1 / this.formDiagramScale)
        this.p5?.text(
          `Structural Mass: ${Math.round(this.totalMass)}lbs`,
          -100,
          -200 - 2 * this.p5?.textAscent()
        )
        this.p5?.text(`Structural Carbon: ${Math.round(this.totalCarbon)}lbs CO2eq`, -100, -200)
        if (this.runOptimizer)
          this.p5?.text(
            `Best Carbon Values: ${this.globalBests.map((val) => Math.round(val)).join(', ')}`,
            -100,
            -200 + 2 * this.p5?.textAscent()
          )
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
        this.drawForceValuesInForm()
        this.drawLengthsInForm()
        this.drawECandMassInForm()
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
              // defaultValue={10}
              value={mainNodeZ}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                setMainNodeZ(Number(v))
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
              value={chordBaseWidth}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                setChordBaseWidth(Number(v))
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
              value={chordZ}
              valueLabelDisplay={'auto'}
              onChange={(e, v) => {
                setChordZ(Number(v))
                fanTruss.current.chordZ = Number(v)
              }}
            />
          </Grid>
          <Grid item>
            <TextField
              defaultValue="Steel"
              onChange={(e) => {
                fanTruss.current.globalBests = fanTruss.current.globalBests.map((_) => 99999)
                const value = e.target.value as keyof typeof materials
                fanTruss.current.tensionMat = { ...materials[value] }
              }}
              fullWidth
              size="small"
              select
              label={'Tension Material'}
            >
              {Object.entries(materials).map(([mat, { carbonCoeff, sigmaT }]) => (
                <MenuItem value={mat} key={`${mat}-tension`}>
                  {mat} [{sigmaT} ksi (T)] [{carbonCoeff} lbCO2eq/lb]
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              onChange={(e) => {
                fanTruss.current.globalBests = fanTruss.current.globalBests.map((_) => 99999)
                const value = e.target.value as keyof typeof materials
                fanTruss.current.compressionMat = { ...materials[value] }
              }}
              fullWidth
              defaultValue="Wood"
              size="small"
              select
              label={'Compression Material'}
            >
              {Object.entries(materials).map(([mat, { carbonCoeff, sigmaC }]) => (
                <MenuItem value={mat} key={`${mat}-compression`}>
                  {mat} [{sigmaC} ksi (C)] [{carbonCoeff} lbCO2eq/lb]
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
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={() =>
                    (fanTruss.current.showForcesAndLengths = !fanTruss.current.showForcesAndLengths)
                  }
                />
              }
              label={'Show forces and length in form diagram'}
            />
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => {
                    fanTruss.current.initializeGenes()
                    fanTruss.current.globalBests = [99999, 99999, 99999]
                    fanTruss.current.runOptimizer = !fanTruss.current.runOptimizer
                  }}
                />
              }
              label={'Run optimization'}
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
          fanTruss.current.optimize()
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
