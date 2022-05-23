//TODO: pole position line in form, load editing
//TODO: Tangents and closing line don't work when edgecondition[1] x val is less than edgecondition[0] x val
import p5Types from "p5"; //Import this for typechecking and intellisense
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"


const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

const constructionGray = 80
const formDiagramEllipseSize = 8
const forceDiagramEllipseSize = 5
const dashSize = 0.1

export default function HookesLaw() {
  const createHookesLaw = useCallback(()=>{
    return {
      p5: undefined as p5Types | undefined,
      forceDiagramScale: 20,
      formDiagramScale: 35,
      formDiagramOffset: [1/3,1/2],
      loads: [0],
      loadXCoordsInForm: [0],
      loadYCoordsInForce: [0],
      nSegments: 10,
      edgeConditionsInForm: [[-5,0],[5,0]],
      closingLineSlope: 0,
      nodesInForm: [[0,0]],
      centerOfMass: [0,0],
      polePosition: 5,
      poleInForm: [0,0],
      poleInForce: [0,0],
      tangentSlopes: [0,0],
      evaluateMouseClickInFormDiagram() {
       const x = (this.p5?.mouseX-(this.p5?.width/3))/this.formDiagramScale 
       const y = (this.p5?.mouseY-(this.p5?.height/2))/this.formDiagramScale 
       return [x,y]
      },
      evaluateNearestBoundary([x,y]: number[]) {
        const d0 = this.p5?.createVector(this.edgeConditionsInForm[0][0],this.edgeConditionsInForm[0][1]).sub(this.p5?.createVector(x,y)).mag()
        const d1 = this.p5?.createVector(this.edgeConditionsInForm[1][0],this.edgeConditionsInForm[1][1]).sub(this.p5?.createVector(x,y)).mag()
        return d0 < d1 ? 0 : 1
      },
      equallySpaceLoadsInForm() {
        const loadSpacing = (this.edgeConditionsInForm[1][0]-this.edgeConditionsInForm[0][0])/this.nSegments
        this.loadXCoordsInForm = Array(this.nSegments-1).fill(1).map((a,i)=>this.edgeConditionsInForm[0][0]+loadSpacing+i*loadSpacing)
      },
      initializeEqualLoads() {
        const loadSize = 1
        this.loads = Array(this.nSegments-1).fill(loadSize)
      },
      updateLoadLine() {
        this.loadYCoordsInForce = Array(this.loads.length+1).fill(0).map((a,i)=>this.loads.reduce((a,b,j)=>a+(j<i ? b : 0),0))
      },
      updateClosingLineSlope() {
        this.closingLineSlope = (this.edgeConditionsInForm[0][1]-this.edgeConditionsInForm[1][1])/(this.edgeConditionsInForm[0][0]-this.edgeConditionsInForm[1][0])
      },
      updateCoM() {
        const distances = this.loadXCoordsInForm.map((x)=> x-this.edgeConditionsInForm[0][0])
        const products = distances.map((d,i)=>d*this.loads[i])
        const numerator = products.reduce((a,b)=>a+b,0) 
        const denominator = this.loads.reduce((a,b)=>a+b,0)
        const xCoord = numerator/denominator+this.edgeConditionsInForm[0][0]
        const yCoord = this.closingLineSlope*(xCoord-this.edgeConditionsInForm[0][0])+this.edgeConditionsInForm[0][1]
        this.centerOfMass = [xCoord,yCoord]
      },
      updatePoleInForm() {
        this.poleInForm = [this.centerOfMass[0],this.centerOfMass[1]+this.polePosition]
      },
      updatePoleInForce() {
        const topPoint = this.loadYCoordsInForce[0]
        const bottomPoint = this.loadYCoordsInForce[this.loadYCoordsInForce.length-1]
        // assumes x coordinates are 0 for whole load line
        const xIntersection = (bottomPoint-topPoint) / (this.tangentSlopes[0]-this.tangentSlopes[1]);
        const yIntersection = this.tangentSlopes[0]*(xIntersection)+topPoint
        this.poleInForce = [xIntersection,yIntersection]
      },
      updateTangentSlopes() {
        const slopeA = (this.edgeConditionsInForm[0][1]-this.poleInForm[1])/(this.edgeConditionsInForm[0][0]-this.poleInForm[0])
        const slopeB = (this.edgeConditionsInForm[1][1]-this.poleInForm[1])/(this.edgeConditionsInForm[1][0]-this.poleInForm[0])
        this.tangentSlopes = [slopeA,slopeB]
      },
      solveFormDiagram() {
        this.nodesInForm = Array(this.nSegments+1).fill([0,0])
        this.nodesInForm.map((a,i)=>{
          switch (i) {
            case 0:
              this.nodesInForm[i] = [this.edgeConditionsInForm[0][0],this.edgeConditionsInForm[0][1]]
              break
            case this.nodesInForm.length-1:
              this.nodesInForm[i] = [this.edgeConditionsInForm[1][0],this.edgeConditionsInForm[1][1]]
              break
            default: 
              const tensionForceSlope = (this.poleInForce[1]-this.loadYCoordsInForce[i-1])/this.poleInForce[0]
              const yIntersection = tensionForceSlope*(this.loadXCoordsInForm[i-1]-this.nodesInForm[i-1][0])+this.nodesInForm[i-1][1]
              this.nodesInForm[i] = [this.loadXCoordsInForm[i-1],yIntersection]
              break
          }
        })
      },
      initialize() {
        this.equallySpaceLoadsInForm()
        this.initializeEqualLoads()
      },
      update() {
        this.updateLoadLine()
        this.updateClosingLineSlope()
        this.updateCoM()
        this.updatePoleInForm()
        this.updateTangentSlopes()
        this.updatePoleInForce()
        this.solveFormDiagram()
      },
      drawLoadPoints() {
        this.p5?.fill(255)
        this.p5?.noStroke()
        this.loadYCoordsInForce.map((y)=>{
          this.p5?.ellipse(0,y,5/this.forceDiagramScale)
        })
      },
      drawLoadLine() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1/this.forceDiagramScale)
        this.loads.map((a,i)=>{
          this.p5?.line(0,this.loadYCoordsInForce[i],0,this.loadYCoordsInForce[i+1])
        })
      },
      drawPoleInForce() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.ellipse(this.poleInForce[0],this.poleInForce[1],forceDiagramEllipseSize/this.forceDiagramScale)
      },
      drawTensionForces() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1/this.forceDiagramScale)
        this.loadYCoordsInForce.map((y)=>{
          this.p5?.line(0,y,this.poleInForce[0],this.poleInForce[1])
        })
      },
      drawEdgeConditionsInForm() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.p5?.ellipse(this.edgeConditionsInForm[0][0],this.edgeConditionsInForm[0][1],formDiagramEllipseSize/this.formDiagramScale,formDiagramEllipseSize/this.formDiagramScale)
        this.p5?.ellipse(this.edgeConditionsInForm[1][0],this.edgeConditionsInForm[1][1],formDiagramEllipseSize/this.formDiagramScale,formDiagramEllipseSize/this.formDiagramScale)
      },
      drawCoMInForm() {
        this.p5?.noStroke()
        this.p5?.fill(constructionGray)
        this.p5?.ellipse(this.centerOfMass[0],this.centerOfMass[1],formDiagramEllipseSize/this.formDiagramScale)
      },
      drawClosingLineInForm() {
        this.p5?.stroke(constructionGray)
        this.p5?.strokeWeight(1/this.formDiagramScale)
        const start = this.p5?.createVector(this.edgeConditionsInForm[0][0],this.edgeConditionsInForm[0][1])
        const end = this.p5?.createVector(this.edgeConditionsInForm[1][0],this.edgeConditionsInForm[1][1])
        while (start.x < (end?.x ?? -999)) {
          this.p5?.line(start?.x,start?.y,start?.x+dashSize,start?.y+dashSize*this.closingLineSlope)
          start?.add(dashSize*2,dashSize*2*this.closingLineSlope)
        }
      },
      drawLoadAlignersInForm() {
        this.p5?.stroke(constructionGray)
        this.p5?.strokeWeight(1/this.formDiagramScale)
        this.loadXCoordsInForm.map((x)=>{
          let start = 8
          while (start > -8) {
            this.p5?.line(x,start,x,start-dashSize)
            start = start-2*dashSize
          }
        })
      },
      drawPoleInForm() {
        this.p5?.noStroke()
        this.p5?.fill(constructionGray)
        this.p5?.ellipse(this.poleInForm[0],this.poleInForm[1],formDiagramEllipseSize/this.formDiagramScale,formDiagramEllipseSize/this.formDiagramScale)
      },
      //TODO: Normalize dash sizes by using slope vectors
      drawTangentsInForm() {
        const [x,y] = this.edgeConditionsInForm[0]
        const start = this.p5?.createVector(x,y)
        this.p5?.stroke(constructionGray)
        this.p5?.strokeWeight(1/this.formDiagramScale)
        while (start.x < this.poleInForm[0]) {
          this.p5?.line(start?.x,start?.y,start?.x+dashSize,start?.y+dashSize*this.tangentSlopes[0])
          start?.add(2*dashSize,2*dashSize*this.tangentSlopes[0])
        }
        start?.set(this.poleInForm[0],this.poleInForm[1])
        while (start.x < this.edgeConditionsInForm[1][0]) {
          this.p5?.line(start?.x,start?.y,start?.x+dashSize,start?.y+dashSize*this.tangentSlopes[1])
          start?.add(2*dashSize,2*dashSize*this.tangentSlopes[1])
        }
      },
      drawNodesInForm() {
        this.p5?.noStroke()
        this.p5?.fill(255)
        this.nodesInForm.map(([x,y])=>{
          this.p5?.ellipse(x,y,formDiagramEllipseSize/this.formDiagramScale,formDiagramEllipseSize/this.formDiagramScale)
        })
      },
      drawEdgesInForm() {
        this.p5?.stroke(255)
        this.p5?.strokeWeight(1/this.formDiagramScale)
        this.nodesInForm.slice(0,this.nodesInForm.length-1).map(([x,y],i)=>{
          this.p5?.line(x,y,this.nodesInForm[i+1][0],this.nodesInForm[i+1][1])
        })

      },
      drawFormDiagram() {
        this.p5?.push()
        this.p5?.translate(this.p5?.width* this.formDiagramOffset[0],this.p5?.height*this.formDiagramOffset[1])
        this.p5?.scale(this.formDiagramScale)
        this.drawEdgeConditionsInForm()
        this.drawCoMInForm()
        this.drawClosingLineInForm()
        this.drawLoadAlignersInForm()
        this.drawPoleInForm()
        this.drawTangentsInForm()
        this.drawNodesInForm()
        this.drawEdgesInForm()
        this.p5?.pop()
      },
      drawForceDiagram() {
        this.p5?.push()
        this.p5?.translate(2*this.p5?.width/3,this.p5?.height/2)
        this.p5?.scale(this.forceDiagramScale)
        this.drawLoadPoints()
        this.drawLoadLine()
        this.drawPoleInForce()
        this.drawTensionForces()
        this.p5?.pop()
      }
    }

  },[])
  const hookesLaw = useRef(createHookesLaw())
  useEffect(() => {
    hookesLaw.current.initialize()
  }, [])

  // TODO: should all of the setups usecallback?
  const setup = useCallback((p5: p5Types, canvasParentRef: Element) => {
    const canv = p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    canv.position(-1, -1);
    canv.style("z-index", -2);
    hookesLaw.current.p5 = p5
  }, [])

  const [editingEdge,setEditingEdge] = useState(-1)

	return (
    <>

    <Typography>Click near one of the form edges to relocate it.  Click again to return to pole-position editing.</Typography>
    <Typography>Load editing coming soon.</Typography>
    <Sketch 
      setup={setup}
      draw={(p5: p5Types)=> {
        p5.background(0)
        if ([0,1].includes(editingEdge)) {
          hookesLaw.current.edgeConditionsInForm[editingEdge] = hookesLaw.current.evaluateMouseClickInFormDiagram()
          hookesLaw.current.equallySpaceLoadsInForm()
        } else {
          hookesLaw.current.polePosition = hookesLaw.current.evaluateMouseClickInFormDiagram()[1]

        }
        hookesLaw.current.update()
        hookesLaw.current.drawForceDiagram()
        hookesLaw.current.drawFormDiagram()
      }}
      mouseClicked={(p5:p5Types)=>{
        if (editingEdge == -1) {
          setEditingEdge(hookesLaw.current.evaluateNearestBoundary(hookesLaw.current.evaluateMouseClickInFormDiagram()))
        } else {
          setEditingEdge(-1)
        }


      }}
      windowResized={(p5: p5Types) => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);}}
    />
		</>
	)
}