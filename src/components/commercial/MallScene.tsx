import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, MeshStandardMaterial, type PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mallShopLayout, SHOP_COLORS } from '../../utils/mallLayout';
import type { TwinViewProps } from './EnergyTwinView';
import type { MallShop } from '../../types/commercial';

function Box({ position, size, color, opacity = 1, metalness = 0, ...rest }: {
  position: [number, number, number]; size: [number, number, number]; color: string;
  opacity?: number; metalness?: number; rotation?: [number, number, number];
}) {
  return <mesh position={position} castShadow={opacity === 1} receiveShadow {...rest}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={metalness ? 0.38 : 0.72} metalness={metalness} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1}/></mesh>;
}
function Label({ text, position, width = 2.4, color = '#ffffff', background = '#143f34' }: { text: string; position: [number, number, number]; width?: number; color?: string; background?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 128);
    ctx.font = '600 52px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(text, 256, 67, 480);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; return texture;
  }, [text, color, background]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={position} scale={[width, width / 4, 1]}><spriteMaterial map={texture} depthTest={false} toneMapped={false}/></sprite>;
}
function Shop({ shop, position, selected, activeFloor, onSelect }: { shop: MallShop; position: [number, number, number]; selected: boolean; activeFloor: number; onSelect: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const focused = shop.floor === activeFloor;
  const color = SHOP_COLORS[shop.status];
  const opacity = focused ? 1 : .4;
  const front = position[2] > 0 ? 1 : -1;
  const click = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect(shop.id); };
  return <group position={position} userData={{ shopId: shop.id }} onClick={click} onPointerOver={e => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
    <Box position={[0, .1, 0]} size={[4.2, .18, 4.5]} color={selected ? '#f0cd65' : '#e7e8dd'} opacity={opacity}/>
    <Box position={[0, 1.3, -front * 2.17]} size={[4.18, 2.5, .15]} color={focused ? '#e8e5d7' : '#bac7bf'} opacity={opacity}/>
    {[-1, 1].map(side => <Box key={side} position={[side * 2.04, 1.3, 0]} size={[.12, 2.5, 4.45]} color="#d8dfd2" opacity={opacity}/>)}
    <Box position={[0, 2.45, 0]} size={[4.2, .18, 4.5]} color="#f1f0e5" opacity={focused ? .3 : .12}/>
    <Box position={[0, 2.15, front * 2.27]} size={[4.2, .5, .22]} color={color} opacity={opacity}/>
    <Box position={[0, 1.06, front * 2.24]} size={[4.03, 1.65, .06]} color={focused ? '#9ec9c4' : '#bac7c3'} opacity={focused ? .42 : .12} metalness={.2}/>
    {[-1, 0, 1].map(x => <Box key={x} position={[x * 1.35, 1.08, front * 2.29]} size={[.045, 1.8, .07]} color="#536c66" opacity={opacity}/>)}
    {[-1, 1].map(side => <Box key={side} position={[side * 1.25, .6, 0]} size={[.9, 1, 1.3]} color={focused ? ['#d9b077', '#a1b5ae', '#e0bfa7'][Number(shop.id.replace('shop-', '')) % 3] : '#b5c4b9'} opacity={opacity}/>)}
    {focused && <Label text={`${shop.id.replace('shop-', '').padStart(2, '0')}  ${shop.category.toUpperCase()}`} position={[0, 2.55, front * 2.43]} width={3.4} background={selected || hover ? '#163d30' : color}/>}
    {(selected || hover) && <mesh position={[0, .23, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.35, 4.65]}/><meshBasicMaterial color="#f5cf61" transparent opacity={.6}/></mesh>}
  </group>;
}
function CameraControls({ reset }: { reset: number }) {
  const { camera, gl, invalidate } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement); controls.target.set(0, 4.2, 0);
    controls.minDistance = 18; controls.maxDistance = 68; controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2.08;
    const redraw = () => invalidate();
    controls.enableDamping = false; controls.screenSpacePanning = true; controls.addEventListener('change', redraw); controls.update(); controlsRef.current = controls;
    return () => { controls.removeEventListener('change', redraw); controls.dispose(); };
  }, [camera, gl, invalidate]);
  useEffect(() => { camera.position.set(25, 22, 30); controlsRef.current?.target.set(0, 4.2, 0); controlsRef.current?.update(); invalidate(); }, [reset, camera, invalidate]);
  return null;
}
function ContextLossGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [gl, onLost]);
  return null;
}
function SolarRoof() {
  return <group position={[0, 11.2, -2.1]}>
    <Box position={[0, -.3, 0]} size={[19.1, .22, 7]} color="#dce3d5"/>
    {[-8.8, 8.8].map(x => <Box key={x} position={[x, -.85, 0]} size={[.16, 1.2, 6.8]} color="#8faaa0"/>)}
    {Array.from({ length: 32 }, (_, i) => <group key={i} position={[(i % 8 - 3.5) * 2.17, .1 + Math.floor(i / 8) * .1, (Math.floor(i / 8) - 1.5) * 1.42]} rotation={[-.18, 0, 0]}>
      <Box position={[0, 0, 0]} size={[2.02, .09, 1.24]} color="#d3e1dd" metalness={.4}/>
      <Box position={[0, .06, 0]} size={[1.91, .04, 1.12]} color="#173d59" metalness={.65}/>
      {[-.6, 0, .6].map(x => <Box key={x} position={[x, .085, 0]} size={[.018, .008, 1.12]} color="#80aaa9"/>)}
      <Box position={[0, .085, 0]} size={[1.91, .008, .018]} color="#80aaa9"/>
    </group>)}
  </group>;
}
function Grounds() {
  return <group>
    <Box position={[0, -.25, 0]} size={[28, .4, 21]} color="#e3e6d9"/>
    <Box position={[0, -.02, 7.8]} size={[25, .08, 2.6]} color="#a7b3ad"/>
    {Array.from({ length: 9 }, (_, i) => <Box key={i} position={[-10 + i * 2.5, .03, 7.8]} size={[.06, .03, 2.2]} color="#eef1e3"/>)}
    {[-10, -6, 6, 10].map((x, i) => <group key={x} position={[x, .42, 7.75]}><Box position={[0, 0, 0]} size={[1.45, .55, .8]} color={['#546e70', '#f2efe4', '#cfac73', '#7b8b9c'][i]}/><Box position={[0, .37, 0]} size={[.9, .35, .7]} color="#9eb4b1"/>{[-.5,.5].map(w => <Box key={w} position={[w,-.25,.1]} size={[.25,.25,.8]} color="#4b5a53"/>)}</group>)}
    {[-11.8, 11.8].flatMap(x => [-7, -2, 3].map(z => <group key={`${x}-${z}`} position={[x, 0, z]}><Box position={[0,.2,0]} size={[1.7,.4,1.7]} color="#c8d3bd"/><mesh position={[0,1.2,0]} castShadow><cylinderGeometry args={[.12,.16,2,6]}/><meshStandardMaterial color="#817b57"/></mesh><mesh position={[0,2.35,0]} castShadow><icosahedronGeometry args={[1.15,1]}/><meshStandardMaterial color="#718f66" roughness={1}/></mesh></group>))}
    <Box position={[0, .04, 9.8]} size={[12, .04, .7]} color="#c0ccb7"/>
  </group>;
}
export default function MallScene({ shops, floor, selected, onSelect, onContextLost }: TwinViewProps & { onContextLost: () => void }) {
  const [roof, setRoof] = useState(true);
  const [reset, setReset] = useState(0);
  const layout = useMemo(() => mallShopLayout(shops), [shops]);
  return <div className="twin-canvas-shell">
    <div className="twin-scene-badge"><span/>ENERGYTWIN <small>3D · SYNTHETIC SITE</small></div>
    <div className="twin-scene-controls"><button aria-pressed={roof} onClick={() => setRoof(!roof)}>{roof ? 'Hide solar roof' : 'Show solar roof'}</button><button onClick={() => setReset(n => n + 1)} aria-label="Reset 3D camera">↻ Reset view</button></div>
    <Canvas shadows="percentage" dpr={[1, 1.5]} frameloop="demand" camera={{ position: [25,22,30], fov: 38, near: .1, far: 150 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: true }} onCreated={({ gl, scene }) => {
      gl.domElement.setAttribute('aria-label', 'Interactive three-floor mall model. Drag to rotate and scroll to zoom. Use the 2D grid for keyboard shop selection.');
    }}>
      <color attach="background" args={['#f0f4ec']}/><fog attach="fog" args={['#f0f4ec',65,120]}/>
      <ambientLight intensity={.8}/><hemisphereLight args={['#ffffff','#cad9be',.9]}/><directionalLight position={[12,27,18]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-normalBias={.05}/><directionalLight position={[-20,10,-10]} intensity={.8}/>
      <Grounds/>
      {[1,2,3].map(f => <group key={f} position={[0,(f-1)*3.6+.2,0]}>
        <Box position={[0,0,0]} size={[19.5,.26,12.1]} color={f === floor ? '#ecebdf' : '#ced7cb'} opacity={f <= floor ? 1 : .14}/>
        {[-9.4,9.4].map(x => <Box key={x} position={[x,1.4,0]} size={[.18,2.6,12]} color="#b7c6b6" opacity={f === floor ? .7 : .2}/>)}
        {[-5.9,5.9].map(z => <Box key={z} position={[0,0.22,z]} size={[19.4,.12,.1]} color="#859e89" opacity={f === floor ? 1 : .2}/>)}
        <Box position={[0,.18,0]} size={[18.5,.03,2.4]} color="#d7ddcc" opacity={f === floor ? 1 : .12}/>
      </group>)}
      {layout.map(({ shop, position }) => <Shop key={shop.id} shop={shop} position={position} selected={selected === shop.id} activeFloor={floor} onSelect={onSelect}/>)}
      {[-9.1,9.1].flatMap(x => [-5.6,5.6].map(z => <Box key={`${x}-${z}`} position={[x,5.1,z]} size={[.22,10.2,.22]} color="#afc1b0"/>))}
      <Box position={[0,1.35,6.13]} size={[3.1,2.4,.07]} color="#89b6ad" opacity={.3}/><Label text="SOLARIS  /  ENERGYTWIN" position={[0,10.6,6.5]} width={6}/>
      {roof && <SolarRoof/>}<CameraControls reset={reset}/><ContextLossGuard onLost={onContextLost}/>
    </Canvas>
    <div className="twin-scene-hint"><span>↔ Drag to orbit</span><span>⌕ Scroll to zoom</span><span>Click a coloured shop</span></div>
  </div>;
}
