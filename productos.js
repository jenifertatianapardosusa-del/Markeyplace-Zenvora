export const MARCA = {
  nombre: 'Zenvora',
  eslogan: 'Tu estilo, tus gustos.', 
};

// Colores del boceto 
export const C = {
  primario: '#CC007A', 
  fondo: '#FBE8FC',    
  suave: '#FFC2E8',    
  texto: '#222222',
  gris: '#6B6B6B',
  blanco: '#FFFFFF',
};

// Las categorías deben escribirse IGUAL en los productos 
export const CATEGORIAS = ['Todas', 'Hogar', 'Deporte', 'Papelería', 'Accesorios'];

// ini = iniciales que se muestran en el recuadro (en lugar de foto)
export const PRODUCTOS_INICIALES = [
  { id: 'PROD-001', ini: 'LE', nombre: 'Lámpara de escritorio', categoria: 'Hogar', precio: 89000, stock: 10, descripcion: 'Lámpara LED con brazo flexible y luz cálida, ideal para estudiar o trabajar en tu escritorio.',
    imagen: require('./assets/productos/LE.jpg')},
  { id: 'PROD-002', ini: 'OC', nombre: 'Organizador de cocina', categoria: 'Hogar', precio: 35000, stock: 8, descripcion: 'Organizador de varios compartimentos para utensilios de cocina.',
    imagen: require('./assets/productos/OC.jpg')},
  { id: 'PROD-003', ini: 'ST', nombre: 'Set de toallas', categoria: 'Hogar', precio: 54000, stock: 5, descripcion: 'Set de tres toallas de algodón suave y muy absorbente.',
    imagen: require('./assets/productos/ST.jpg')},
  { id: 'PROD-004', ini: 'BD', nombre: 'Botella deportiva', categoria: 'Deporte', precio: 42000, stock: 15, descripcion: 'Botella de 750 ml con tapa antiderrames para entrenar.',
    imagen: require('./assets/productos/BD.jpg')},
  { id: 'PROD-005', ini: 'BE', nombre: 'Banda elástica', categoria: 'Deporte', precio: 24000, stock: 12, descripcion: 'Banda de resistencia media para ejercicios en casa.',
    imagen: require('./assets/productos/BE.webp')},
    { id: 'PROD-006', ini: 'CS', nombre: 'Cuerda para saltar', categoria: 'Deporte', precio: 18000, stock: 20, descripcion: 'Cuerda ajustable con mangos antideslizantes.',
    imagen: require('./assets/productos/CS.jpg')},
  { id: 'PROD-007', ini: 'AG', nombre: 'Agenda 2027', categoria: 'Papelería', precio: 28000, stock: 9, descripcion: 'Agenda anual con vista semanal y tapa dura resistente.',
    imagen: require('./assets/productos/AG.jpg')},
  { id: 'PROD-008', ini: 'SM', nombre: 'Set de marcadores', categoria: 'Papelería', precio: 22000, stock: 14, descripcion: 'Doce marcadores de colores con punta fina.',
    imagen: require('./assets/productos/SM.jpg')},
  { id: 'PROD-009', ini: 'CA', nombre: 'Cuaderno argollado', categoria: 'Papelería', precio: 12000, stock: 30, descripcion: 'Cuaderno de 100 hojas con argolla doble.',
    imagen: require('./assets/productos/CA.jpg')},
  { id: 'PROD-010', ini: 'MU', nombre: 'Maleta urbana', categoria: 'Accesorios', precio: 65000, stock: 0, descripcion: 'Maleta resistente con compartimento para portátil.',
    imagen: require('./assets/productos/MU.webp')},
  { id: 'PROD-011', ini: 'GC', nombre: 'Gorra clásica', categoria: 'Accesorios', precio: 32000, stock: 7, descripcion: 'Gorra ajustable de algodón en varios colores.',
    imagen: require('./assets/productos/GC.jpg')},
  { id: 'PROD-012', ini: 'BC', nombre: 'Billetera compacta', categoria: 'Accesorios', precio: 38000, stock: 6, descripcion: 'Billetera delgada con espacio para tarjetas y billetes.',
    imagen: require('./assets/productos/BC.jpg')},
];