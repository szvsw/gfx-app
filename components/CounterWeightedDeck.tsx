import p5Types from "p5"; //Import this for typechecking and intellisense
import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});


export const CalatravaSketch: React.FC = () => {
  const createCalatrava = useCallback(() => {
    return {
      p5: undefined as p5Types | undefined,
      nSegmentsInDeck: 8,
      deckLoad:  1,
      towerVectorAngle: Math.PI/3,
      towerVector: [Math.cos(Math.PI/3), Math.sin(Math.PI/3)],
      deckVector: [1,0],
      origin: [0,0],
      deckPointsInForm: [[0,0]],
      towerPointsInForm: [[0,0]],
      cableVectors: [[0,0]],
      cablePointsInForce: [[0,0]],
      deckPointsInForce: [[0,0]],
      towerPointsInForce: [[0,0]],
      formScalar: 50,
      forceScalar: 25,
      formOffset: [0.25,0.85],
      forceOffset: [0.85,0.85],
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
        this.updateDeck()
        this.updateTower()
        this.updateCableVectorsAndPoints()
        this.updateDeckPointsInForce()
        this.updateTowerPointsInForce()
      },
      drawDeckPointsInForm() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.deckPointsInForm.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,10/this.formScalar,10/this.formScalar) 
        })
      },
      drawTowerPointsInForm() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.towerPointsInForm.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,10/this.formScalar,10/this.formScalar) 
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
      drawCablePointsInForce() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.cablePointsInForce.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,10/this.formScalar,10/this.formScalar) 
        })
      },
      drawDeckPointsInForce() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.deckPointsInForce.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,10/this.formScalar,10/this.formScalar) 
        })
      },
      drawTowerPointsInForce() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.towerPointsInForce.map(([x,y])=>{ 
            this.p5?.ellipse(x,y,10/this.formScalar,10/this.formScalar) 
        })
      },
      drawDeckSelfWeights() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1/this.forceScalar)
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.deckPointsInForce[i]
          const [x2,y2] = this.deckPointsInForce[i+1]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawTowerSelfWeights() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/this.forceScalar)
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.towerPointsInForce[i]
          const [x2,y2] = this.towerPointsInForce[i+1]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawCableTensionForces() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/this.forceScalar)
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.cablePointsInForce[i]
          const [x2,y2] = this.cablePointsInForce[i+1]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawDeckCompressionForces() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/this.forceScalar)
        this.p5?.noFill()
        Array(this.nSegmentsInDeck).fill(0).map((elem,i)=>{
          const [x1,y1] = this.cablePointsInForce[i]
          const [x2,y2] = this.deckPointsInForce[i]
          this.p5?.line(x1,y1,x2,y2)
        })
      },
      drawTowerCompressionForces() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1.0/this.forceScalar)
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
          this.drawDeckPointsInForm()
          this.drawTowerPointsInForm()
          this.drawTowerSegmentsInForm()
          this.drawDeckSegmentsInForm()
          this.drawTensionCablesInForm()
        this.p5?.pop()
      },
      drawForceDiagram() {
        this.p5?.push()
          this.p5?.translate(this.p5?.width*this.forceOffset[0],this.p5?.height*this.forceOffset[1])
          this.p5?.scale(this.forceScalar)
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


	return (
    <>
      <Box sx={{mt: "2rem", width: "30%"}}> 

        <Typography gutterBottom>Number of Cables</Typography>
        <Slider size="small" onChange={(e) => calatrava.current.nSegmentsInDeck = e.target.value} defaultValue={8} step={1} min={3} max={16} marks={true}/>
        <Typography gutterBottom>Deck Length</Typography>
        <Slider size="small" onChange={(e) => calatrava.current.deckVector = [e.target.value,0]} defaultValue={1} step={0.01} min={0.1} max={2.5}/>
        <Typography gutterBottom>Tower Angle</Typography>
        <Slider size="small" 
          onChange={(e) => {
            calatrava.current.towerVectorAngle= e.target.value
            calatrava.current.towerVector = [Math.cos(calatrava.current.towerVectorAngle), Math.sin(calatrava.current.towerVectorAngle)]
          }} 
          defaultValue={Math.PI/3} step={0.01} min={0.01} max={Math.PI/2-0.01}
        />
      </Box>

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
