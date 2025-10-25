import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Loader, ArrowRightLeft } from "lucide-react";

// --- 3D Background Component ---
const ThreeDBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let THREE;
    let scene, camera, renderer, shapes = [], particles = [];
    let animationFrameId;

    const initThreeScene = () => {
      THREE = window.THREE;

      // 1. Scene
      scene = new THREE.Scene();
      // Set a subtle background color for depth
      scene.background = new THREE.Color(0xf0f4f8); // A very light, cool gray

      // 2. Camera
      camera = new THREE.PerspectiveCamera(
        60, // Slightly narrower FOV for less distortion
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 8; // Slightly further back

      // 3. Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing for smoother edges
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current.appendChild(renderer.domElement);

      // 4. Geometries
      const geometries = [
        new THREE.IcosahedronGeometry(0.8, 0),
        new THREE.TorusGeometry(0.6, 0.25, 16, 50),
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.DodecahedronGeometry(0.7, 0), // New geometry
        new THREE.OctahedronGeometry(0.7, 0),  // New geometry
        new THREE.SphereGeometry(0.6, 32, 32)
      ];

      // Materials with varied colors/properties
      const materials = [
        new THREE.MeshPhongMaterial({ color: 0x4a90e2, flatShading: true }), // Blue
        new THREE.MeshPhongMaterial({ color: 0x50e3c2, flatShading: true }), // Green
        new THREE.MeshPhongMaterial({ color: 0xf5a623, flatShading: true }), // Orange
        new THREE.MeshPhongMaterial({ color: 0xbd10e0, flatShading: true }), // Purple
        new THREE.MeshPhongMaterial({ color: 0x7ed321, flatShading: true }), // Lime Green
      ];

      // 5. Create and add shapes to the scene
      for (let i = 0; i < 70; i++) { // More shapes
        const geo = geometries[Math.floor(Math.random() * geometries.length)];
        const mat = materials[Math.floor(Math.random() * materials.length)];
        const shape = new THREE.Mesh(geo, mat);

        shape.position.set(
          (Math.random() - 0.5) * 30, // Wider distribution
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30 - 10 // Pushed back slightly
        );

        shape.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        const scale = Math.random() * 0.4 + 0.2; // Varied scale
        shape.scale.set(scale, scale, scale);

        shapes.push(shape);
        scene.add(shape);
      }

      // 6. Particle System
      const particleCount = 1000;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = [];

      for (let i = 0; i < particleCount; i++) {
        positions.push(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50 - 20
        );
      }

      particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.1,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
      });
      const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particleSystem);
      particles.push(particleSystem); // Keep reference to animate

      // 7. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Softer ambient light
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6); // Main light source
      directionalLight1.position.set(5, 5, 5).normalize();
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3); // Secondary light for contrast
      directionalLight2.position.set(-5, -5, -5).normalize();
      scene.add(directionalLight2);

      const pointLight = new THREE.PointLight(0xffffff, 0.8, 100); // Dynamic point light
      pointLight.position.set(0, 0, 0); // Will animate this
      scene.add(pointLight);

      // 8. Animation Loop
      let time = 0;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        time += 0.01;

        // Animate shapes
        shapes.forEach(shape => {
          shape.rotation.x += 0.001; // Slower rotation
          shape.rotation.y += 0.0015;
          // Subtle floating motion
          shape.position.y += Math.sin(time + shape.uuid.charCodeAt(0) * 0.1) * 0.001;
          shape.position.x += Math.cos(time + shape.uuid.charCodeAt(1) * 0.1) * 0.001;
        });

        // Animate point light
        pointLight.position.x = Math.sin(time * 0.5) * 7;
        pointLight.position.y = Math.cos(time * 0.5) * 7;

        // Animate particles
        particleSystem.rotation.y += 0.0005;


        renderer.render(scene, camera);
      };
      animate();
    };

    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', onWindowResize);

    if (window.THREE) {
      initThreeScene();
    } else {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.async = true;
      script.onload = () => {
        if (mountRef.current) {
          initThreeScene();
        }
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
    
    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Clean up three.js objects
      shapes.forEach(shape => {
          if (shape.geometry) shape.geometry.dispose();
          if (shape.material) shape.material.dispose();
          scene.remove(shape);
      });
      particles.forEach(p => {
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
        scene.remove(p);
      });
      materials.forEach(mat => mat.dispose()); // Dispose custom materials
      if(renderer) renderer.dispose();
      if(scene) scene.clear();
    };

  }, []);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full -z-10" />;
};


// --- Main App Component ---
function App() {
  const [textinput, setTextInput] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTextTranslation = async () => {
    if (!textinput || !selectValue) {
      setResult("Please enter text and select a language.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const options = {
        method: 'POST',
        url: 'https://google-translator9.p.rapidapi.com/v2',
        headers: {
          'x-rapidapi-key': '10d2d05841mshe0a5718783d5690p15c037jsne708c3247872',
          'x-rapidapi-host': 'google-translator9.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        data: {
          q: `${textinput}`,
          source: 'en',
          target: `${selectValue}`,
          format: 'text'
        }
      };
      const response = await axios.request(options);
      setLoading(false);
      const translatedText = response?.data?.data?.translations?.[0]?.translatedText;
      if (translatedText) {
        setResult(translatedText);
      } else {
        setResult("Translation failed. Please try again.");
      }
    }
    catch (error) {
      setLoading(false);
      console.log("Error while calling the translation api", error);
      setResult("An error occurred during translation.");
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans">
      <ThreeDBackground />
      
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        
        <div className="w-full max-w-xl md:max-w-2xl p-6 md:p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col gap-y-6">
          
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800">
            Global Translator
          </h1>
          
          <div className="flex flex-col gap-y-4">
            <div>
              <label htmlFor="input-text" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Enter Text (Source: English)
              </label>
              <textarea
                name="input-text"
                id="input-text"
                placeholder="Enter text to translate..."
                className="bg-white/80 h-32 w-full border border-gray-300 outline-none rounded-lg text-lg text-gray-700 px-4 py-3 resize-none transition-all duration-300 ring-2 ring-transparent focus:ring-blue-500 shadow-sm"
                onChange={(e) => setTextInput(e.target.value)}
                value={textinput}
              />
            </div>

            <div>
              <label htmlFor="output-text" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Translation
              </label>
              <textarea
                name="output-text"
                id="output-text"
                placeholder="Translation will appear here..."
                className="bg-gray-100/90 h-32 w-full border border-gray-300 outline-none rounded-lg text-lg font-bold text-gray-600 px-4 py-3 resize-none shadow-sm"
                value={result}
                readOnly
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="options" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Select Language
              </label>
              <select
                id="options"
                name="value"
                className="bg-white/80 w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 outline-none cursor-pointer transition-all duration-300 ring-2 ring-transparent focus:ring-blue-500 shadow-sm"
                onChange={(e) => setSelectValue(e.target.value)}
                value={selectValue}
              >
                <option value="">Select Language</option>
                <option value="hi">Hindi</option>
                <option value="gu">Gujarati</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>

            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full sm:w-auto cursor-pointer flex items-center justify-center gap-x-2.5 font-semibold shadow-lg hover:bg-blue-700 active:scale-95 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTextTranslation}
              disabled={loading}
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <ArrowRightLeft size={18} />
              )}
              <span>{loading ? "Translating..." : "Translate Text"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;

