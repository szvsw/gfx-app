import p5Types from "p5"; //Import this for typechecking and intellisense
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});
export const EquilibriumNode: React.FC = () => {
  const createEquilibriumNode = useCallback(()=>{
    return {
      nForces: 3,
      angles: [0,Math.PI/4,2*Math.PI/3],
      vectors: [[0,0]],
      magnitudes: [0],
      pointsInForce: [[0,0]],
      p5: undefined as undefined | p5Types,
      initializeAngles() {
        this.angles = Array(this.nForces).fill(0).map((a,i)=>2*i*Math.PI/(this.nForces+1))
        this.magnitudes = Array(this.nForces).fill(100)
      },
      sortAngles() {
        const magnitudesWithKeys = this.magnitudes.map((a,i)=> {return {id: i, value: a}})
        magnitudesWithKeys.sort((a: {id: number},b: {id: number})=>this.angles[a.id]-this.angles[b.id])
        this.magnitudes = magnitudesWithKeys.map((a: {value: number})=>a.value)
        this.angles.sort((a,b)=>a-b)


      },
      updateVectorsFromAngles() {
        this.vectors = this.angles.map((angle)=>[Math.cos(angle),Math.sin(angle)])
      },
      updateForcePoints() {
        this.pointsInForce = Array(this.vectors.length).fill([0,0])
         this.pointsInForce.map(( elem,i )=> {
          switch (i) {
            case 0:
              this.pointsInForce[0] = [0,0]
              break;
            default:
              this.pointsInForce[i] = [this.pointsInForce[i-1][0]-this.vectors[i-1][0]*this.magnitudes[i-1],this.pointsInForce[i-1][1]-this.vectors[i-1][1]*this.magnitudes[i-1]]
              break;
          }
        })
        this.vectors[this.nForces-1] = [this.pointsInForce[this.nForces-1][0]-this.pointsInForce[0][0],this.pointsInForce[this.nForces-1][1]-this.pointsInForce[0][0]]
        this.magnitudes[this.nForces-1] = Math.sqrt(
          Math.pow(
            this.vectors[this.nForces-1][0],
            2
            )
          +
          Math.pow(
            this.vectors[this.nForces-1][1],
            2
            )
        )
      },
      drawForm() {
        this.p5?.push()
        this.p5?.translate(this.p5?.width/3,3*this.p5?.height/4)
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.ellipse(0,0,10,10)
        this.p5?.strokeWeight(1)
        this.vectors.map(([x,y],i)=>{
          const vector = this.p5?.createVector(x,y) 
          const formLengthScalar = this.magnitudes[i]
          vector?.setMag(formLengthScalar)
          const arrowHeadVector = this.p5?.createVector(x,y)
          const cutLineVector = this.p5?.createVector(x,y)
          cutLineVector?.rotate(Math.PI/2).setMag(formLengthScalar/20)
          this.p5?.stroke(255)
          this.p5?.line(vector.x/this.magnitudes[i]*12,vector.y/this.magnitudes[i]*12,vector.x,vector.y)
          this.p5?.line(vector?.x-cutLineVector.x,vector?.y-cutLineVector.y,vector?.x+cutLineVector?.x,vector?.y+cutLineVector.y)
          arrowHeadVector?.rotate(Math.PI/4).setMag(formLengthScalar/20)
          this.p5?.line(vector.x/this.magnitudes[i]*12,vector?.y/this.magnitudes[i]*12,vector.x/this.magnitudes[i]*12+arrowHeadVector?.x,vector.y/this.magnitudes[i]*12+arrowHeadVector.y)
          arrowHeadVector?.rotate(-Math.PI/2)
          this.p5?.line(vector.x/this.magnitudes[i]*12,vector?.y/this.magnitudes[i]*12,vector.x/this.magnitudes[i]*12+arrowHeadVector?.x,vector.y/this.magnitudes[i]*12+arrowHeadVector.y)
          this.p5?.stroke(0)
          const nextVectIndex = (i+this.vectors.length-1)%this.vectors.length
          const nextVectorVals = this.vectors[nextVectIndex]
          const nextVector = this.p5?.createVector(nextVectorVals[0],nextVectorVals[1])
          nextVector?.setMag(this.magnitudes[nextVectIndex])
          const centroid = [(vector.x+nextVector?.x)/3,(vector.y+nextVector?.y)/3]
          this.p5?.text(String.fromCharCode("A".charCodeAt(0)+i),centroid[0],centroid[1])
        })
        this.p5?.pop()
      },
      drawForce() {
        this.p5?.push()
        this.p5?.translate(2*this.p5?.width/3,3*this.p5?.height/4)
        this.pointsInForce.map(([x,y],i)=>{
          this.p5?.fill(255)
          this.p5?.noStroke()
          this.p5?.ellipse(x,y,10,10)
          this.p5?.stroke(255)
          this.p5?.strokeWeight(1)
          const [x2,y2] = this.pointsInForce[(i+1)%this.nForces]
          this.p5?.line(x,y,x2,y2)
          this.p5?.stroke(0)
          this.p5?.text(String.fromCharCode("a".charCodeAt(0)+i),x+5,y+15)
        })
        this.p5?.pop()
      }
    }
  },[])

  const equilibriumNode = useRef(createEquilibriumNode())
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    const canv = p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    canv.position(-1, -1);
    canv.style("z-index", -2);
    equilibriumNode.current.p5 = p5
    equilibriumNode.current.initializeAngles()
  }
  const [dummy,setDummy] = useState(0)
	return (
		<>
        <Typography gutterBottom>Number of Forces</Typography>
        <Slider size="small" 
          onChange={(e) => {
            equilibriumNode.current.nForces = e.target.value
            equilibriumNode.current.initializeAngles()
            setDummy((dum)=>dum+1)
          }}
          defaultValue={3} 
          step={1} 
          min={3} 
          max={8} 
          marks={true}
        />

      <Stack spacing="1rem" direction="row">
        <Stack sx={{mt: "0.25rem", width: "30%"}} spacing="0.5rem">

          {equilibriumNode.current.angles.map((angle,i)=> i<equilibriumNode.current.angles.length-1 && (
            <Box key={`angle-slider-${i}`} > 
              <Typography gutterBottom>Angle</Typography>
              <Slider  size="small" 
                onChange={(e) => {
                  equilibriumNode.current.angles[i]= e.target.value
                  equilibriumNode.current.sortAngles()
                  setDummy((dum)=>dum+1)
                }}
                defaultValue={angle} 
                value={equilibriumNode.current.angles[i]}
                step={0.01} 
                min={0} 
                max={2*Math.PI} 
              />
            </Box>
          ))}
        </Stack>
        <Stack sx={{mt: "0.25rem", width: "30%"}} spacing="0.5rem">

          {equilibriumNode.current.magnitudes.map((mag,i)=> i<equilibriumNode.current.magnitudes.length-1 && (
            <Box key={`magnitude-slider-${i}`} > 
              <Typography gutterBottom>Magnitude</Typography>
              <Slider  size="small" 
                onChange={(e) => {
                  equilibriumNode.current.magnitudes[i]= e.target.value
                  setDummy((dum)=>dum+1)
                }}
                defaultValue={mag} 
                value={equilibriumNode.current.magnitudes[i]}
                step={0.01} 
                min={0} 
                max={500} 
              />
            </Box>
          ))}
        </Stack>

      </Stack>
    <Sketch 
      setup={setup}
      draw={(p5: p5Types)=> {
        p5.background(0)
        equilibriumNode.current.updateVectorsFromAngles()
        equilibriumNode.current.updateForcePoints()
        equilibriumNode.current.drawForm()
        equilibriumNode.current.drawForce()
      }}
      windowResized={(p5: p5Types) => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);}}
    />
		</>
	)
}