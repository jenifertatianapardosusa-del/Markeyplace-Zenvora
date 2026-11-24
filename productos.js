//  el stock y el precio final estan en las VARIANTES.
// El stock total de un producto se calcula sumando sus variantes 

export const MARCA = {
  nombre: 'Zenvora',
  eslogan: 'Tu estilo, tus gustos.',
};

export const C = {
  primario: '#CC007A',
  fondo: '#FBE8FC',
  suave: '#FFC2E8',
  texto: '#222222',
  gris: '#6B6B6B',
  blanco: '#FFFFFF',
};

export const CATEGORIAS = ['Todas', 'Hogar', 'Deporte', 'Papelería', 'Accesorios'];

// Envio tarifas ficticias
export const MUNICIPIOS = ['Mosquera', 'Funza', 'Madrid'];
export const MODALIDADES = [
  {id: 'estandar', nombre: 'Estandar'},
  {id: 'express', nombre: 'Express'},
];
export const TARIFAS = {
  Mosquera: {estandar: 6000, express: 10000},
  Funza: {estandar: 8000, express: 12000},
  Madrid: {estandar: 10000, express: 14000},
};
export const PLAZOS = {
  Mosquera: {estandar: '1 a 2 días', express: '1 día'},
  Funza: {estandar: '2 a 3 días', express: '1 a 2 días'},
  Madrid: {estandar: '3 a 4 días', express: '2 a 3 días'},
};

// Los productos sin opciones tienen una sola variante llamada 'Única'.
// el carrito siempre guarda (producto, variante, cantidad).
const unica = (id, precio, stock) => [{ id: id + '-U', etiqueta: 'Única', precio, stock }];

// Tres productos con variantes: PROD-001 (color), PROD-004 (capacidad) y PROD-011 (color).
export const PRODUCTOS_INICIALES = [
  { id: 'PROD-001', ini: 'LE', nombre: 'Lámpara de escritorio', marca: 'Lumina', categoria: 'Hogar', precio: 89000,
    descripcion: 'Lámpara LED con brazo flexible y luz cálida, ideal para estudiar o trabajar en tu escritorio.',
    imagen: require('./assets/productos/LE.jpg'),
    variantes: [
      { id: 'PROD-001-BL', etiqueta: 'Blanca', precio: 89000, stock: 5 },
      { id: 'PROD-001-NE', etiqueta: 'Negra', precio: 89000, stock: 3 },
      { id: 'PROD-001-RO', etiqueta: 'Rosada', precio: 95000, stock: 2 },
    ] },
  { id: 'PROD-002', ini: 'OC', nombre: 'Organizador de cocina', marca: 'Casa Viva', categoria: 'Hogar', precio: 35000,
    descripcion: 'Organizador de varios compartimentos para utensilios de cocina.',
    imagen: require('./assets/productos/OC.jpg'), variantes: unica('PROD-002', 35000, 8) },
  { id: 'PROD-003', ini: 'ST', nombre: 'Set de toallas', marca: 'Casa Viva', categoria: 'Hogar', precio: 54000,
    descripcion: 'Set de tres toallas de algodón suave y muy absorbente.',
    imagen: require('./assets/productos/ST.jpg'), variantes: unica('PROD-003', 54000, 5) },
  { id: 'PROD-004', ini: 'BD', nombre: 'Botella deportiva', marca: 'AquaFit', categoria: 'Deporte', precio: 38000,
    descripcion: 'Botella con tapa antiderrames para entrenar, en tres capacidades.',
    imagen: require('./assets/productos/BD.jpg'),
    variantes: [
      { id: 'PROD-004-500', etiqueta: '500 ml', precio: 38000, stock: 8 },
      { id: 'PROD-004-750', etiqueta: '750 ml', precio: 42000, stock: 7 },
      { id: 'PROD-004-1L', etiqueta: '1 L', precio: 48000, stock: 0 },
    ] },
  { id: 'PROD-005', ini: 'BE', nombre: 'Banda elástica', marca: 'FitPlus', categoria: 'Deporte', precio: 24000,
    descripcion: 'Banda de resistencia media para ejercicios en casa.',
    imagen: require('./assets/productos/BE.webp'), variantes: unica('PROD-005', 24000, 12) },
  { id: 'PROD-006', ini: 'CS', nombre: 'Cuerda para saltar', marca: 'FitPlus', categoria: 'Deporte', precio: 18000,
    descripcion: 'Cuerda ajustable con mangos antideslizantes.',
    imagen: require('./assets/productos/CS.jpg'), variantes: unica('PROD-006', 18000, 20) },
  { id: 'PROD-007', ini: 'AG', nombre: 'Agenda 2027', marca: 'Papelia', categoria: 'Papelería', precio: 28000,
    descripcion: 'Agenda anual con vista semanal y tapa dura resistente.',
    imagen: require('./assets/productos/AG.jpg'), variantes: unica('PROD-007', 28000, 9) },
  { id: 'PROD-008', ini: 'SM', nombre: 'Set de marcadores', marca: 'Papelia', categoria: 'Papelería', precio: 22000,
    descripcion: 'Doce marcadores de colores con punta fina.',
    imagen: require('./assets/productos/SM.jpg'), variantes: unica('PROD-008', 22000, 14) },
  { id: 'PROD-009', ini: 'CA', nombre: 'Cuaderno argollado', marca: 'Papelia', categoria: 'Papelería', precio: 12000,
    descripcion: 'Cuaderno de 100 hojas con argolla doble.',
    imagen: require('./assets/productos/CA.jpg'), variantes: unica('PROD-009', 12000, 30) },
  { id: 'PROD-010', ini: 'MU', nombre: 'Maleta urbana', marca: 'Urbano', categoria: 'Accesorios', precio: 65000,
    descripcion: 'Maleta resistente con compartimento para portátil.',
    imagen: require('./assets/productos/MU.webp'), variantes: unica('PROD-010', 65000, 0) },
  { id: 'PROD-011', ini: 'GC', nombre: 'Gorra clásica', marca: 'Urbano', categoria: 'Accesorios', precio: 32000,
    descripcion: 'Gorra ajustable de algodón en varios colores.',
    imagen: require('./assets/productos/GC.jpg'),
    variantes: [
      { id: 'PROD-011-NE', etiqueta: 'Negra', precio: 32000, stock: 4 },
      { id: 'PROD-011-RO', etiqueta: 'Rosada', precio: 32000, stock: 3 },
      { id: 'PROD-011-BL', etiqueta: 'Blanca', precio: 32000, stock: 0 },
    ] },
  { id: 'PROD-012', ini: 'BC', nombre: 'Billetera compacta', marca: 'Urbano', categoria: 'Accesorios', precio: 38000,
    descripcion: 'Billetera delgada con espacio para tarjetas y billetes.',
    imagen: require('./assets/productos/BC.jpg'), variantes: unica('PROD-012', 38000, 6) },
];

// Direcciones de prueba
export const DIRECCIONES_INICIALES = [
  {id: 'DIR-1', alias: 'Casa', municipio: 'Mosquera', referencia: 'Conjunto Los Pinos, torre 2, apto 301', principal: true},
  {id: 'DIR-2', alias: 'Oficina', municipio: 'Funza', referencia: 'Edificio Central, oficina 502', principal: false},
];

// Preguntas de prueba 
export const CONSULTAS_INICIALES = [
  {id: 'Q-1', productoId: 'PROD-001', pregunta: '¿La luz se puede regular?', estado: 'Respondida', fecha: '05/11/2026',
    respuesta: 'Respuesta automatica de demostracion',}
];