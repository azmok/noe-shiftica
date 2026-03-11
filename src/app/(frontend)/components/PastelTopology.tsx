"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
    uniform float uTime;
    varying float vNoise;
    varying vec3 vPosition;

    // Simple 3D Noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        return 42.0 * dot(m*m*m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
        vPosition = position;
        // 時間と共に変化する複雑なノイズを生成
        float noise = snoise(vec3(position * 0.4 + uTime * 0.1));
        vNoise = noise;

        // 頂点をノイズで変形
        vec3 newPosition = position + normal * noise * 0.6;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

const fragmentShader = `
    varying float vNoise;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
        // パステルカラーの定義
        vec3 pink = vec3(1.0, 0.75, 0.85); // Pastel Pink
        vec3 blue = vec3(0.54, 0.81, 0.94); // Baby Blue
        
        // 高さ(vPosition.y)とノイズ(vNoise)を組み合わせて色を混ぜる
        float mixFactor = vPosition.y * 0.3 + vNoise * 0.5 + 0.5;
        vec3 baseColor = mix(pink, blue, mixFactor);
        
        // 時間で色を微妙にシフトさせる
        baseColor.r += sin(uTime * 0.5) * 0.1;
        baseColor.b += cos(uTime * 0.5) * 0.1;

        // 密度が高いところ（ワイヤーフレームの重なり）を明るく
        float alpha = (0.2 + vNoise * 0.1);
        
        gl_FragColor = vec4(baseColor, alpha);
    }
`;

export function PastelTopology() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 毎回のマウントごとに新しいシーンとレンダラーを作成する（コンテキスト喪失によるフリーズを防ぐため）
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        const geometry = new THREE.IcosahedronGeometry(2, 40);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { uTime: { value: 0 } },
            wireframe: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x89cff0,
            transparent: true,
            opacity: 0.05
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        scene.add(core);

        // ウィンドウサイズに合わせる
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        containerRef.current.appendChild(renderer.domElement);

        let isMounted = true;
        let animationFrameId: number;

        const animate = () => {
            if (!isMounted) return;
            animationFrameId = requestAnimationFrame(animate);
            const time = performance.now() * 0.0005;
            material.uniforms.uTime.value = time * 2.0;

            mesh.rotation.y = time * 0.2;
            mesh.rotation.x = time * 0.1;

            const s = 1.0 + Math.sin(time * 2.0) * 0.05;
            mesh.scale.set(s, s, s);

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // クリーンアップ関数
        return () => {
            isMounted = false;
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);

            if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }

            // メモリリークと、ナビゲーション時のWebGLコンテキスト上限エラー・フリーズを防ぐため
            // 完全にリソースを破棄し、WebGLコンテキストを強制解放する
            geometry.dispose();
            material.dispose();
            coreGeo.dispose();
            coreMat.dispose();

            renderer.dispose();
            renderer.forceContextLoss(); // ブラウザに即座にコンテキストを解放させる
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 -z-10 pointer-events-none overflow-hidden" />;
}
