import p5Types from "p5"; //Import this for typechecking and intellisense
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import  ToggleButton  from "@mui/material/ToggleButton";
import  ToggleButtonGroup  from "@mui/material/ToggleButtonGroup";

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});


export const CalatravaSketch: React.FC = () => {
  const createCalatrava = useCallback(() => {
    return {
      p5: undefined as p5Types | undefined,
      ellipseSize: 5,
      nSegmentsInDeck: 8,
      deckLoad:  1,
      towerVectorAngle: Math.PI/3,
      towerVectorMagnitude: 1,
      towerVector: [Math.cos(Math.PI/3), Math.sin(Math.PI/3)],
      deckVector: [1,0],
      forceScaleNormalizer: 0,
      origin: [0,0],
      deckPointsInForm: [[0,0]],
      towerPointsInForm: [[0,0]],
      cableVectors: [[0,0]],
      cablePointsInForce: [[0,0]],
      deckPointsInForce: [[0,0]],
      towerPointsInForce: [[0,0]],
      formScalar: 50,
      forceScalar: 15,
      formOffset: [0.25,0.85],
      forceOffset: [0.65,0.85],
      updateTowerVector() {
        this.towerVector = [this.towerVectorMagnitude*Math.cos(this.towerVectorAngle), this.towerVectorMagnitude*Math.sin(this.towerVectorAngle)]
      },
      updateDeck() {
        const deckOffset = this.deckVector.map((a: number)=>a*0.5)
        this.deckPointsInForm = Array(this.nSegmentsInDeck).fill([0,0]).map((elem,i)=> {
          return this.origin.map((coord,j)=>coord+deckOffset[j]+this.deckVector[j]*i)
        })
      },
      updateTower() {
        const towerOffset = this.towerVector.map((a: number)=>a*0.5)
        this.towerPointsInForm = Array(this.nSegmentsInDeck).fill([0,0]).map((elem,i)=> {
          return this.origin.map((coord,j)=>coord-towerOffset[j]-this.towerVector[j]*i)
        })
      },
      updateCableVectorsAndPoints() {
        this.cablePointsInForce = Array(this.nSegmentsInDeck+1).fill([0,0])
        this.cableVectors = Array(this.nSegmentsInDeck).fill([0,0]).map((elem,i)=> {
          const vect = this.towerPointsInForm[i].map((coord,j)=>coord-this.deckPointsInForm[i][j])
          const vectMag = Math.sqrt(vect[0]*vect[0]+vect[1]*vect[1])
          const unitVect = vect.map(coord => coord / vectMag)
          this.cablePointsInForce[i+1] = this.cablePointsInForce[i].map((coord,j)=>coord+unitVect[j])
          return unitVect
        })
      },
      updateDeckPointsInForce() {
        const x = this.cablePointsInForce[this.cablePointsInForce.length-1][0]
        this.deckPointsInForce = Array(this.nSegmentsInDeck+1).fill([0,0]).map((elem,i)=>[x,this.cablePointsInForce[i][1]])
      },
      updateTowerPointsInForce() {
        const towerSlope = this.towerVector[1] / this.towerVector[0]
        const x = this.cablePointsInForce[this.cablePointsInForce.length-1][0]
        this.towerPointsInForce = Array(this.nSegmentsInDeck+1).fill([0,0]).map((elem,i)=>{
          const y1 = this.cablePointsInForce[i][1]
          const x1 = this.cablePointsInForce[i][0]
          const y = towerSlope *(x-x1)+y1
          return [x,y]
        })
      },
      update() {
        this.updateTowerVector()
        this.updateDeck()
        this.updateTower()
        this.updateCableVectorsAndPoints()
        this.updateDeckPointsInForce()
        this.updateTowerPointsInForce()
        this.forceScaleNormalizer = this.deckVector[0]/(this.deckPointsInForce[0][1]-this.deckPointsInForce[1][1])
      },
      drawDeckPointsInForm() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.deckPointsInForm.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,this.ellipseSize/this.formScalar,this.ellipseSize/this.formScalar) 
        })
      },
      drawTowerPointsInForm() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.towerPointsInForm.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,this.ellipseSize/this.formScalar,this.ellipseSize/this.formScalar) 
        })
      },
      drawTowerSegmentsInForm() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/this.formScalar)
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.towerPointsInForm[i].map((coord,j)=>coord-0.5*this.towerVector[j])
          const [x2,y2] = this.towerPointsInForm[i].map((coord,j)=>coord+0.5*this.towerVector[j])
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawDeckSegmentsInForm() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/this.formScalar)
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.deckPointsInForm[i].map((coord,j)=>coord-0.5*this.deckVector[j])
          const [x2,y2] = this.deckPointsInForm[i].map((coord,j)=>coord+0.5*this.deckVector[j])
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawTicksInForm() {
        this.p5?.stroke(75)
        this.p5?.strokeWeight(1.0/this.formScalar)
        this.p5?.noFill()
        const rotatedTowerVec = this.p5?.createVector(this.towerVector[0],this.towerVector[1])
        rotatedTowerVec?.rotate(this.p5 ? this.p5.PI/2 : 0).setMag(0.1)
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.deckPointsInForm[i].map((coord,j)=>coord+0.5*this.deckVector[j])
          this.p5?.line(x1,y1-0.1,x1,y1+0.1)
          const [x2,y2] = this.towerPointsInForm[i].map((coord,j)=>coord-0.5*this.towerVector[j])
          rotatedTowerVec ? this.p5?.line(x2+rotatedTowerVec.x,y2+rotatedTowerVec.y,x2-rotatedTowerVec.x,y2-rotatedTowerVec.y) : null

        })
      },
      drawTensionCablesInForm() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/this.formScalar)
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.deckPointsInForm[i]
          const [x2,y2] = this.towerPointsInForm[i]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawTowerSelfWeightsInForm() {
        this.p5?.stroke(75)
        this.p5?.strokeWeight(1.0/this.formScalar)
        this.p5?.noFill()
        this.towerPointsInForm.map(([x,y])=> {
          this.p5?.line(x,y,x,y+0.75)
          this.p5?.line(x,y+0.75,x-0.1,y+0.65)
          this.p5?.line(x,y+0.75,x+0.1,y+0.65)
        })
      },
      drawDeckSelfWeightsInForm() {
        this.p5?.stroke(75)
        this.p5?.strokeWeight(1.0/this.formScalar)
        this.p5?.noFill()
        this.deckPointsInForm.map(([x,y]) => { 
          this.p5?.line(x,y,x,y+0.75)
          this.p5?.line(x,y+0.75,x-0.1,y+0.65)
          this.p5?.line(x,y+0.75,x+0.1,y+0.65)
        })
      },
      drawReactionInForm() {
        this.p5?.stroke(75)
        this.p5?.strokeWeight(1.0/this.formScalar)
        this.p5?.noFill()
        const [x,y] = [0,2.1]
        this.p5?.line(x,y,x,y-2)
        this.p5?.line(x,y-2,x-0.1,y-2+0.1)
        this.p5?.line(x,y-2,x+0.1,y-2+0.1)
      },
      drawHingeInForm() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        const [x,y] = [0,0]
        this.p5?.ellipse(x,y,this.ellipseSize/this.formScalar,this.ellipseSize/this.formScalar) 
      },
      drawCablePointsInForce() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.cablePointsInForce.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,this.ellipseSize/(this.forceScaleNormalizer*this.forceScalar),this.ellipseSize/(this.forceScaleNormalizer*this.forceScalar)) 
        })
      },
      drawDeckPointsInForce() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.deckPointsInForce.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,this.ellipseSize/(this.forceScaleNormalizer*this.forceScalar),this.ellipseSize/(this.forceScaleNormalizer*this.forceScalar)) 
        })
      },
      drawTowerPointsInForce() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.towerPointsInForce.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,this.ellipseSize/(this.forceScaleNormalizer*this.forceScalar),this.ellipseSize/(this.forceScaleNormalizer*this.forceScalar)) 
        })
      },
      drawDeckSelfWeights() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1/(this.forceScaleNormalizer*this.forceScalar))
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.deckPointsInForce[i]
          const [x2,y2] = this.deckPointsInForce[i+1]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawTowerSelfWeights() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/(this.forceScaleNormalizer*this.forceScalar))
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.towerPointsInForce[i]
          const [x2,y2] = this.towerPointsInForce[i+1]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawCableTensionForces() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/(this.forceScaleNormalizer*this.forceScalar))
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.cablePointsInForce[i]
          const [x2,y2] = this.cablePointsInForce[i+1]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawDeckCompressionForces() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/(this.forceScaleNormalizer*this.forceScalar))
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.cablePointsInForce[i]
          const [x2,y2] = this.deckPointsInForce[i]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawTowerCompressionForces() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/(this.forceScaleNormalizer*this.forceScalar))
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.cablePointsInForce[i]
          const [x2,y2] = this.towerPointsInForce[i]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawFormDiagram()  {
        this.p5?.push()
          this.p5?.translate(this.p5?.width*this.formOffset[0],this.p5?.height*this.formOffset[1])
          this.p5?.scale(this.formScalar)
          this.drawTowerSelfWeightsInForm()
          this.drawDeckSelfWeightsInForm()
          this.drawReactionInForm()
          this.drawTowerSegmentsInForm()
          this.drawDeckSegmentsInForm()
          this.drawTensionCablesInForm()
          this.drawDeckPointsInForm()
          this.drawTowerPointsInForm()
          this.drawHingeInForm()
          this.drawTicksInForm()
        this.p5?.pop()
      },
      drawForceDiagram() {
        this.p5?.push()
          this.p5?.translate(this.p5?.width*this.forceOffset[0],this.p5?.height*this.forceOffset[1])
          this.p5?.scale(this.forceScalar)
          this.p5?.scale(this.forceScaleNormalizer)
          this.p5?.translate(-1*this.cablePointsInForce[this.cablePointsInForce.length-1][0],0)
          this.drawCablePointsInForce()
          this.drawDeckPointsInForce()
          this.drawTowerPointsInForce()
          this.drawDeckSelfWeights()
          this.drawTowerSelfWeights()
          this.drawCableTensionForces()
          this.drawDeckCompressionForces()
          this.drawTowerCompressionForces()
        this.p5?.pop()
      },

    }
  }, [])

  const calatrava = useRef(createCalatrava())
  


  const setup = (p5: p5Types, canvasParentRef: Element) => {
    const canv = p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    canv.position(-1, -1);
    canv.style("z-index", -2);
    calatrava.current.p5 = p5
    calatrava.current.update()
    calatrava.current.drawForceDiagram()
    calatrava.current.drawFormDiagram()
  }
  
  const mouseClickedDraw = (p5: p5Types) => {

  }

  const [inputGroup,setInputGroup] = useState<string>("geometric")

	return (
    <>
      <ToggleButtonGroup sx={{mt: "1rem"}} exclusive onChange={(event: React.MouseEvent<HTMLElement>,newInputGroup: string)=>setInputGroup(newInputGroup)} value={inputGroup}>
        <ToggleButton value="geometric">Geometric Properties</ToggleButton>
        <ToggleButton value="material">Material Properties</ToggleButton>
      </ToggleButtonGroup>
      <Stack sx={{mt: "2rem",}} direction="row" spacing="2rem" alignItems="center">

      <Box sx={{ width: "30%",display: inputGroup=="geometric" ? "inline" : "none"}}> 

        <Typography gutterBottom>Number of Cables</Typography>
        <Slider size="small" onChange={(e) => calatrava.current.nSegmentsInDeck = e.target.value} defaultValue={8} step={1} min={3} max={16} marks={true}/>
        <Typography gutterBottom>Deck Length</Typography>
        <Slider size="small" onChange={(e) => calatrava.current.deckVector = [e.target.value,0]} defaultValue={1} step={0.01} min={0.1} max={2.5}/>
        <Typography gutterBottom>Tower Angle</Typography>
        <Slider size="small" 
          onChange={(e) => calatrava.current.towerVectorAngle= e.target.value}
          defaultValue={Math.PI/3} step={0.01} min={0.01} max={Math.PI/2-0.01}
        />
        <Typography gutterBottom>Tower Length</Typography>
        <Slider size="small" 
          onChange={(e) => calatrava.current.towerVectorMagnitude = e.target.value} 
          defaultValue={1} step={0.01} min={0.25} max={2}
        />
      </Box>
      <Box sx={{display: inputGroup=="material" ? "inline" : "none"}}>
        <Stack spacing="1rem">
          <TextField
              size="small"
              id="standard-number"
              label="Deck Weight (kips/ft)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          <TextField
              size="small"
              id="standard-number"
              label="Deck Allowable Stress (ksi)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          <TextField
              size="small"
              id="standard-number"
              label="Deck GWP (lbs CO2eq/lb)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
        </Stack>
      </Box>
      <Box sx={{display: inputGroup=="material" ? "inline" : "none"}}>
        <Stack spacing="1rem">
          <TextField
              size="small"
              id="standard-number"
              label="Tower Density (kips/ft^3)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          <TextField
              size="small"
              id="standard-number"
              label="Tower Allowable Stress (ksi)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          <TextField
              size="small"
              id="standard-number"
              label="Tower GWP (lbs CO2eq/lb)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
        </Stack>
      </Box>
      <Box sx={{display: inputGroup=="material" ? "inline" : "none"}}>
        <Stack spacing="1rem">
          <TextField
              size="small"
              id="standard-number"
              label="Cable Density (kips/ft^3)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          <TextField
              size="small"
              id="standard-number"
              label="Cable Allowable Stress (ksi)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          <TextField
              size="small"
              id="standard-number"
              label="Cable GWP (lbs CO2eq/lb)"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
        </Stack>
      </Box>
      </Stack>

      <Sketch
        setup={setup}
        draw={(p5: p5Types) => {
          p5.background(0)
          // calatrava.current.towerVectorAngle = p5.map(p5.mouseX,p5.width,0,p5.PI/2-0.01,0.01)
          // calatrava.current.towerVector = [Math.cos(calatrava.current.towerVectorAngle), Math.sin(calatrava.current.towerVectorAngle)],
          // calatrava.current.deckVector = [p5.map(p5.mouseY,0,p5.height,0.25,3),0]
          calatrava.current.update()
          calatrava.current.drawForceDiagram()
          calatrava.current.drawFormDiagram()
        }}
        mouseClicked={mouseClickedDraw}
        // mouseWheel={handleWheelZoom}
        // mouseDragged={moveMap}
        // mouseReleased={() => (lastPosRef.current = null)}
        // keyPressed={handleZoom}
        windowResized={(p5: p5Types) => {
          p5.resizeCanvas(p5.windowWidth, p5.windowHeight);}}
      />
    </>
  )
}
