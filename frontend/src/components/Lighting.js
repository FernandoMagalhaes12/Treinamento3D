import React from 'react';

const Lighting = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#EAB308" />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
    </>
  );
};

export default Lighting;