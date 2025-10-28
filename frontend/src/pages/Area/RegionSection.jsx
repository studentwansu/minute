  
  const RegionSection = () => {
    return (
      <section style={{ padding: '40px', backgroundColor: '#f0f0f0' }}>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '180px',
                height: '250px',
                backgroundColor: '#ddd',
                borderRadius: '8px'
              }}
            />
          ))}
        </div>
      </section>
    );
  };

  export default RegionSection;
