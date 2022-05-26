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

type point = {
  x: number,
  y: number
}
type node = {
  locInForm: point,
  forcePolygon: point[]
  edges: edge[]
}
type edge = {
  isLoad: boolean,
  isReaction: boolean,
  nodes: node[],
  pointsInForce: point[],
  // + magnitude means vector is not flipped at node[0], - mag means vector is flipped at node[0]
  magnitude: number | null,
  // angle+ is cw from +x axis, vector is take from nodes[0] TO nodes[1]
  angle: number | null,
}

export const BasicTruss: React.FC = () => {
  const createBasicTruss = useCallback(()=>{
    return {
      p5: undefined as undefined | p5Types,
      nodes: [] as node[],
      edges: [] as edge[],
      initialize() {
        const node0: node = {
          forcePolygon: [],
          edges: [],
          locInForm: {x: 0, y: 0}
        }
        const node1: node = {
          forcePolygon: [],
          edges: [],
          locInForm: {x: 5, y: 0}
        }
        const node2: node = {
          forcePolygon: [],
          edges: [],
          locInForm: {x: 2.5, y: 2.5}
        }
        const node3: node = {
          forcePolygon: [],
          edges: [],
          locInForm: {x: 7.5, y: 2.5}
        }
        const node4: node = {
          forcePolygon: [],
          edges: [],
          locInForm: {x: 10, y: 0}
        }
        const edge01: edge = {
          nodes: [node0,node1],
          isLoad: false,
          isReaction: false,
          pointsInForce: [] as point[],
          magnitude: null,
          angle: null
        }
        const edge02: edge = {
          nodes: [node0,node2],
          isLoad: false,
          isReaction: false,
          pointsInForce: [] as point[],
          magnitude: null,
          angle: null
        }
        const edge12: edge = {
          nodes: [node1,node2],
          isLoad: false,
          isReaction: false,
          pointsInForce: [] as point[],
          magnitude: null,
          angle: null
        }
        const edge13: edge = {
          nodes: [node1,node3],
          isLoad: false,
          isReaction: false,
          pointsInForce: [] as point[],
          magnitude: null,
          angle: null
        }
        const edge14: edge = {
          nodes: [node1,node4],
          isLoad: false,
          isReaction: false,
          pointsInForce: [] as point[],
          magnitude: null,
          angle: null
        }
        const edge23: edge = {
          nodes: [node2,node3],
          isLoad: false,
          isReaction: false,
          pointsInForce: [] as point[],
          magnitude: null,
          angle: null
        }
        const edge34: edge = {
          nodes: [node3,node4],
          isLoad: false,
          isReaction: false,
          pointsInForce: [] as point[],
          magnitude: null,
          angle: null
        }

        const load0: edge = {
          nodes: [node0],
          magnitude: 3,
          isLoad: true,
          isReaction: false,
          pointsInForce: [] as point [],
          angle: null,
        }
        const load1: edge = {
          nodes: [node1],
          magnitude: 0,
          isLoad: true,
          isReaction: false,
          pointsInForce: [] as point [],
          angle: null,
        }
        const load4: edge = {
          nodes: [node4],
          magnitude: 3,
          isLoad: true,
          isReaction: false,
          pointsInForce: [] as point [],
          angle: null,
        }
        const reaction2: edge = {
          nodes: [node2],
          magnitude: null,
          isLoad: false,
          isReaction: true,
          pointsInForce: [] as point [],
          angle: null,
        }
        const reaction3: edge = {
          nodes: [node3],
          magnitude: null,
          isLoad: false,
          isReaction: true,
          pointsInForce: [] as point [],
          angle: null,
        }

        const edges = [edge01,edge02,edge12,edge13,edge14,edge23,edge34,load0,load1,load4,reaction2,reaction3]
        const nodes = [node0,node1,node2,node3,node4]
        edges.map((edge)=>edge.nodes.map((node)=>node.edges.push(edge)))
        this.nodes = nodes
        this.edges = edges
      },
      determineMemberVectors() {
        this.edges.map((edge)=> {
          if (edge.isLoad || edge.isReaction) return edge.angle=Math.PI/2
          const vector: point = {x: edge.nodes[1].locInForm.x -edge.nodes[0].locInForm.x, y: edge.nodes[1].locInForm.y-edge.nodes[0].locInForm.y}
          const p5Vector = this.p5?.createVector(vector.x,vector.y)
          const angle = p5Vector ? p5Vector.heading() : null
          edge.angle = angle
        })
      },
      sortNodesByNumberOfUnknownForceMagnitudes() {
        this.nodes = this.nodes.sort((a,b)=>{
          const countUnknownForces = (node:node) => {
            return node.edges.reduce((accum,nextEdge)=>accum+(nextEdge.magnitude ? 0 : 1),0)
          }
          return countUnknownForces(a) - countUnknownForces(b)
        })
      },
      solveReactions() {
        // Sum of the load forces and reactions must be in equilibrium
        // Moments about a reaction node must be in equilibrium
        const reactions = this.edges.filter((edge)=>edge.isReaction)
        const loadMoments = this.edges.reduce((sum,edge)=>{
          if (!edge.isLoad) {
            return sum+0
          }
          const moment = (edge.magnitude ?? 0)*(edge.nodes[0].locInForm.x-reactions[0].nodes[0].locInForm.x)
          return sum+moment

        },0)
        reactions[1].magnitude = -loadMoments/(reactions[1].nodes[0].locInForm.x-reactions[0].nodes[0].locInForm.x)
        const loadTotal = this.edges.reduce((sum,edge)=>{
          if (!edge.isLoad) {
            return sum+0
          }
          return sum+(edge.magnitude??0)
        },0)
        reactions[0].magnitude = -(reactions[1].magnitude+loadTotal)
      },
      solveNodesWithOneOrTwoUnknowns() {
        this.sortNodesByNumberOfUnknownForceMagnitudes()

        this.nodes.map((node)=>{
          const numberOfUnknowns = node.edges.reduce((a,b)=>a + (b.magnitude!==null ? 0 : 1),0)
          // Skip nodes which are either known or have more than two unknowns
          if (numberOfUnknowns > 2 || numberOfUnknowns == 0) return null
          // Find components of existing forces on the node
          // The magnitude is defined such that when the force is positive, the direction of the angle vector
          // aligns with the direction of the force at node 0 of the edge's two nodes.
          // so if it is positive, then the member is in tension, if it is negative, then the member is in cop,
          // since the angle of the vector is defined as the angle from the node[0] to node[1], 
          // so positive means the node is being pulled in towards the member
          const Fy = node.edges.reduce((a,b)=>{
            return a + (b.magnitude ? (b.nodes[0]==node ? b.magnitude : -b.magnitude)*Math.sin(b.angle) : 0)
          },0)
          const Fx = node.edges.reduce((a,b)=>{
            return a + (b.magnitude ? (b.nodes[0]==node ? b.magnitude : -b.magnitude)*Math.cos(b.angle) : 0)
          },0)
          if (numberOfUnknowns == 1) {
            const edge = node.edges.filter((edge)=>edge.magnitude===null)[0]
            const magnitude = Math.sqrt(Math.pow(Fx,2)+Math.pow(Fy,2))
            edge.magnitude = edge.nodes[0] == node ? magnitude : -magnitude
            edge.magnitude = Math.abs(edge.magnitude) < .000000001 ? 0 : edge.magnitude // TODO : Figure out why the rounding error is occurring.
            return
          } else {
            const [edgeA, edgeB] = node.edges.filter((edge)=>edge.magnitude===null)

            // The system of equations to solve
            // magA*sin(edgeA.angle)+magB*sin(edgeB.angle) = -Fy
            // magA*cos(edgeA.angle)+magB*cos(edgeB.angle) = -Fx
            // magA = (-Fy-magB*sin(edgeB.angle))/sin(edgeA.angle)
            // magA = (-Fx-magB*cos(edgeB.angle))/cos(edgeA.angle)

            // 0 = (-Fy*cos(edgeA.angle)-magB*sin(edgeB.angle)*cos(edgeA.angle))+Fx*sin(edgeA.angle)+magB*cos(edgeB.angle)*sin(edgeA.angle)
            // Fy*cos(edgeA.angle)-Fx*sin(edgeA.angle) = magB*(cos(edgeB.angle)*sin(edgeA.angle)-sin(edgeB.angle)*cos(edgeA.angle))
            // magB = (Fy*cos(edgeA.angle)-Fx*sin(edgeA.angle)) / (cos(edgeB.angle)*sin(edgeA.angle)-sin(edgeB.angle)*cos(edgeA.angle))
            const edgeBMag = (Fy*Math.cos(edgeA.angle)-Fx*Math.sin(edgeA.angle)) / (Math.cos(edgeB.angle)*Math.sin(edgeA.angle)-Math.sin(edgeB.angle)*Math.cos(edgeA.angle))
            const edgeAMag = Math.abs(edgeA.angle)<0.01 ?  ((-Fx-edgeBMag *(Math.cos(edgeB.angle)))/Math.cos(edgeA.angle)) : ((-Fy-edgeBMag *(Math.sin(edgeB.angle)))/Math.sin(edgeA.angle))
            edgeA.magnitude = edgeA.nodes[0] == node ? edgeAMag : -edgeAMag
            edgeB.magnitude = edgeB.nodes[0] == node ? edgeBMag : -edgeBMag
            edgeA.magnitude = Math.abs( edgeA.magnitude ) < .000001 ? 0 : edgeA.magnitude // TODO : Figure out why the rounding error is occurring.
            edgeB.magnitude = Math.abs( edgeB.magnitude ) < .000001 ? 0 : edgeB.magnitude // TODO : Figure out why the rounding error is occurring.


          }
        })

      },
      solveAllNodes() {
          // this.solveNodesWithOneOrTwoUnknowns()
        while (this.edges.reduce((a,b)=>a+(b.magnitude!==null ? 0 : 1),0) > 0) {
          this.solveNodesWithOneOrTwoUnknowns()
        }
      },
      resetInternalForces() {
        this.edges.map((edge)=>{
          if (!edge.isLoad && !edge.isReaction) {
            edge.magnitude = null
          }
        })
      },
      determinePointsInForce() {
        // const node = this.nodes[0]
        // node.edges.map((edge,i)=>{
        //   if (i==0) {
        //     const start: point = {x: 0, y:0}
        //     const end: point = {x: start.x+edge.magnitude*Math.cos(edge.angle), y: start.y+edge.magnitude*Math.sin(edge.angle)}
        //     edge.pointsInForce = [start,end]
        //     return
        //   }
        //   const start = node.edges[i-1].pointsInForce[1]
        //   const end: point = {x: start.x+edge.magnitude*Math.cos(edge.angle), y: start.y+edge.magnitude*Math.sin(edge.angle)}
        //   edge.pointsInForce = [start,end]
        // })
        // this.nodes.sort((a,b)=>b.locInForm.x==a.locInForm.x ? b.locInForm.y-a.locInForm.y : b.locInForm.x - a.locInForm.x )
        this.nodes.map((node,i)=>{
          console.log(`Beginning work on node ${node.locInForm.x},${node.locInForm.y}`)
          node.edges.sort((a,b)=>a.angle-b.angle)
          const noLocationsKnown =  (node.edges.reduce((a,b)=>a+(b.pointsInForce.length==0 ? 1 : 0),0)==node.edges.length)
          if (i!=0 && noLocationsKnown) {
            console.log("Not the first node and no locations known, therefore skipping")
            return null
          }
          if (i==0 && noLocationsKnown) {
            console.log("This is the first node and no locations are known, so creating first tri")
            node.edges.map((edge,j)=>{
              const magnitude = node==edge.nodes[0] ? edge.magnitude : -edge.magnitude
              const start = (noLocationsKnown && j==0) ? {x: 0, y:0} : node.edges[j-1].pointsInForce[1]
              const end: point = {x: start.x+magnitude*Math.cos(edge.angle), y: start.y+magnitude*Math.sin(edge.angle)}
              edge.pointsInForce = [start,end]
              return
            })
          }
          const firstKnownEdgeIndex = node.edges.indexOf(node.edges.filter(edge=>edge.pointsInForce.length > 0)[0])
          console.log(firstKnownEdgeIndex)
          node.edges.map((_edge,j)=>{
            console.log(`trying to solve edge ${j}`)
            const edge = node.edges[(j+firstKnownEdgeIndex+node.edges.length)%node.edges.length]
            const magnitude = node==edge.nodes[0] ? edge.magnitude : -edge.magnitude
            const start =  j==0 ? node.edges[firstKnownEdgeIndex].pointsInForce[1] : node.edges[((j+firstKnownEdgeIndex-1)+node.edges.length)%node.edges.length].pointsInForce[1]
            const end: point = {x: start.x+magnitude*Math.cos(edge.angle), y: start.y+magnitude*Math.sin(edge.angle)}
            edge.pointsInForce = [start,end]
            return
          })
        })
        // const nextNode = this.nodes[3]
        // nextNode.edges = nextNode.edges.sort((a,b)=>{
        //   // const aAngle =( a.nodes[0] == nextNode) ? a.angle : (a.angle + Math.PI) % (2*Math.PI)
        //   // const bAngle =(b.nodes[0]==nextNode) ? b.angle : (b.angle + Math.PI) % (2*Math.PI)
        //   return a.angle-b.angle
        // })
        // nextNode.edges.map((edge,i)=>{
        //   if (i==0) {
        //     const magnitude = nextNode==edge.nodes[0] ? edge.magnitude : -edge.magnitude
        //     const start: point = {x: 12, y:0}
        //     const end: point = {x: start.x+magnitude*Math.cos(edge.angle), y: start.y+magnitude*Math.sin(edge.angle)}
        //     edge.pointsInForce = [start,end]
        //     return
        //   }
        //   const magnitude = nextNode==edge.nodes[0] ? edge.magnitude : -edge.magnitude
        //   const start = nextNode.edges[i-1].pointsInForce[1]
        //   const end: point = {x: start.x+magnitude*Math.cos(edge.angle), y: start.y+magnitude*Math.sin(edge.angle)}
        //   edge.pointsInForce = [start,end]
        // })
      }

    }
  }, [])

  const truss = useRef(createBasicTruss())
  const setup = useCallback((p5: p5Types, canvasParentRef: Element)=>{
    const canv = p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    canv.position(-1, -1);
    canv.style("z-index", -2);
    truss.current.p5 = p5
    truss.current.initialize()

  },[])
	return (
    <>
    <Sketch 
      setup={setup}
      draw={(p5: p5Types)=> {
        // truss.current.nodes[0].locInForm={x:(p5.mouseX-p5.width/2)/30,y:(p5.mouseY-p5.height/2)/30} // TODO: figure out why nodes 1 and 4 mess up the drawing
        truss.current.resetInternalForces()
        truss.current.determineMemberVectors()
        truss.current.solveReactions()
        truss.current.solveAllNodes()
        truss.current.determinePointsInForce()
        p5.background(0)
        truss.current.edges.map((edge)=>{

          p5.push()
          p5.translate(p5.width/8,p5.height/2)
          p5.scale(30)
          p5.stroke(255)
          p5.strokeWeight(1/30)
          p5.ellipse(0,0,1,1)
          if (edge.pointsInForce[0]) p5.line(edge.pointsInForce[0].x,edge.pointsInForce[0].y,edge.pointsInForce[1].x,edge.pointsInForce[1].y)
          p5.pop()



          if (edge.isLoad || edge.isReaction) {
            return
          }


          const nodes = edge.nodes
          const coords = nodes.map((node)=>node.locInForm)
          p5.push()
          p5.translate(p5.width/2,p5.height/2)
          p5.scale(30)
          p5.strokeWeight(1/30)
          edge.magnitude!==null ? p5.stroke(edge.magnitude > 0 ? Math.abs(edge.magnitude)*30 : 0,edge.magnitude==0 ? 255 : 0, edge.magnitude < 0 ? Math.abs(edge.magnitude)*30  : 0) : p5.stroke(100)
          p5.line(coords[0].x, coords[0].y,coords[1].x,coords[1].y)
          const dirVect = p5.createVector(Math.cos(edge.angle),Math.sin(edge.angle)).setMag(0.25)
          p5.stroke(255)
          p5.line(coords[0].x,coords[0].y,coords[0].x+dirVect.x,coords[0].y+dirVect.y)
          // p5.line(coords[1].x,coords[1].y,coords[1].x-dirVect.x,coords[1].y-dirVect.y)
          p5.pop()
        })
      }}
      mouseClicked={(p5:p5Types)=>{
      }}
      windowResized={(p5: p5Types) => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);}}
    />
    </>
  )
}