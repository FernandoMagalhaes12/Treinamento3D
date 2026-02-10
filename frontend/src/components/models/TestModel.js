import React from 'react';

const TestModel = () => {
  return (
    <group>
      {/* Simple box */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      
      {/* Ground */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
    </group>
  );
};

export default TestModel;
