import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, StatusBar, FlatList, Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCTOS_INICIALES, CATEGORIAS, MARCA, C } from './productos';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

// FUNCIONES DE CLACULO
const formatoCOP = (n) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// el stock total es la suma del stock de las variantes
const stockTotal= (p) => p.variantes.reduce((suma, v) => suma + v.stock, 0);
const precioDesde = (p) => Math.min(...p.variantes.map((v) => v.precio));
const hayVariantes = (p) => p.variantes.length > 1;

// Busca ell producto y la variante a partir de los id guardados en el carrito
const buscarVariante = (productos, productoId, varianteId) => {
  const p = productos.find((x) => x.id === productoId);
  const v = p ? p.variantes.find((x) => x.id === varianteId) : null;
  return {p, v};
}

// SUBOTAL, DESCUENTO, ENVIO Y TOTAL
const calcularResumen = (carrito, productos, cuponActivo) => {
  const subtotal = carrito.reduce((acc, l) => {
    const {v} = buscarVariante(productos, l.id, l.varianteId);  
    return acc + (v ? v.precio * l.cantidad : 0);
  }, 0);
  const descuento = cuponActivo ? Math.round(subtotal * 0.1) : 0;
  const envio = subtotal === 0 ? 0 : subtotal >= 150000 ? 0 : 8000;
  const total = Math.max(0, subtotal - descuento + envio);
  return { subtotal, descuento, envio, total };
};

// COMPONENTES REUTILIZABLES
function Encabezado({ titulo, eslogan, icono, onVolver, children }) {
  return (
    <View style={s.encabezado}>
      
      <View style={s.circuloGrande} />
      <View style={s.circuloPequeno} />

      <View style={s.fila}>
        {onVolver && (
          <Pressable onPress={onVolver} style={[s.btnRedondo, { marginRight: 12 }]}>
            <Ionicons name="arrow-back" size={22} color={C.primario} />
          </Pressable>
        )}
        {icono && (
          <View style={s.iconoEnc}>
            <Ionicons name={icono} size={26} color={C.primario} />
          </View>
        )}
        <View>
          <Text style={s.marca}>{titulo}</Text>
          {eslogan ? <Text style={s.eslogan}>{eslogan}</Text> : null}
        </View>
      </View>
      {children}
      
    </View>
  );
}

function Vacio({ icono, mensaje, detalle, textoBoton, onPress }) {
  return (
    <View style={s.vacio}>
      <View style={s.circuloVacio}>
        <Ionicons name={icono} size={56} color={C.primario} />
      </View>
      <Text style={s.vacioTitulo}>{mensaje}</Text>
      {detalle ? <Text style={s.vacioTxt}>{detalle}</Text> : null}
      <Pressable style={[s.boton, { marginTop: 8 }]} onPress={onPress}>
        <Text style={s.botonTxt}>{textoBoton}</Text>
      </Pressable>
    </View>
  );
}

function Foto({ p, style, inicialesStyle }) {
  if (p.imagen) return <Image source={p.imagen} style={style} resizeMode="cover" />;
  return <Text style={inicialesStyle}>{p.ini}</Text>;
}

function Tarjeta({ p, esFav, onFav, onPress }) {
  return (
    <Pressable style={s.tarjeta} onPress={onPress}>
      <View style={s.recuadro}>
        <Foto p={p} style={s.fotoTarjeta} inicialesStyle={s.iniciales} />
        {stockTotal(p) === 0 && <Text style={s.agotado}>AGOTADO</Text>}
        <Pressable style={s.corazon} onPress={onFav}>
          <Ionicons name={esFav ? 'heart' : 'heart-outline'} size={20} color={C.primario} />
        </Pressable>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={s.tarjetaNombre}>{p.nombre}</Text>
        <Text style={s.gris}>{p.categoria}</Text>
        <Text style={s.gris}>{p.stock === 0 ? 'Agotado' : 'Disponible: ' + stockTotal(p)}</Text>
        <Text style={s.precio}>{(hayVariantes(p) ? 'Desde ' : ' ') +formatoCOP(precioDesde(p))}</Text>
      </View>
    </Pressable>
  );
}

// PANTALLAS

// CATALOGO
function Catalogo({ productos, favoritos, toggleFavorito, abrirDetalle, busqueda, setBusqueda, categoria, setCategoria, orden, setOrden}) {
  // busqueda + categoria juntas, luego se ordena solo lo filtrado
  let lista = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
      (categoria === 'Todas' || p.categoria === categoria)
  );
  lista = [...lista].sort((a, b) => (orden === 'asc' ? precioDesde(a) - precioDesde(b) : precioDesde(b) - precioDesde(a)));

  return(
    <View style={{ flex: 1}}>
      <Encabezado titulo={MARCA.nombre} eslogan={MARCA.eslogan}>
        <View style={s.buscador}>
          <Ionicons name="search" size={20} color={C.primario} />
          <TextInput
          style={s.inputBuscar}
          placeholder="Buscar en Zenvora"
          value={busqueda}
          onChangeText={setBusqueda}
          />
        </View>
      </Encabezado>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0}} contentContainerStyle=
      {s.chips}>
          {CATEGORIAS.map((c) => (
            <Pressable key={c} onPress={() => setCategoria(c)} style={[s.chip, c === categoria && s.chipOn]}>
              <Text style={[s.chipTxt, c === categoria && { color: C.blanco}]}>{c}</Text>
            </Pressable>
          ))}
      </ScrollView>

      <View style={[s.fila, { justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }]}>
        <Text style={s.gris}>{lista.length} productos</Text>
        <Pressable style={s.chip} onPress={() => setOrden(orden === 'asc' ? 'desc' : 'asc')}>
          <Text style={s.chipTxt}>{orden === 'asc' ? 'Menor a mayor' : 'Mayor a menor'}</Text> 
        </Pressable>
      </View>

      <FlatList
          data={lista}
          numColumns={2}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16}}
          ListEmptyComponent={<Text style={s.vacioTxt}>No encontramos productos</Text>}
          renderItem={({ item}) =>(
            <Tarjeta p={item} esFav={favoritos.includes(item.id)} onFav={() => toggleFavorito(item.id)} onPress={()=>
              abrirDetalle(item)} />
          )}
          />
    </View>
  );
}

// DETALLE DEL PRODUCTO
function Detalle({ producto, esFav, toggleFavorito, agregar, volver, valoraciones, valorar }) {
  // Si el producto tiene una sola variante, queda elegida automáticamente
  const [varianteId, setVarianteId] = useState(hayVariantes(producto) ? null : producto.variantes[0].id);
  const variante = producto.variantes.find((v) => v.id === varianteId) || null;
  const agotado = stockTotal(producto) === 0;
  const sinStockVariante = variante !== null && variante.stock === 0;
  const bloqueado = agotado || sinStockVariante;
  const lista = valoraciones[producto.id] || [];
  const promedio = lista.length ? lista.reduce((a, b) => a + b, 0) / lista.length : 0;
  const precioMostrado = variante ? variante.precio : precioDesde(producto);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.heroDetalle}>
        <Foto p={producto} style={s.fotoHero} inicialesStyle={s.inicialesGrandes} />
        <Pressable style={[s.btnRedondo, { position: 'absolute', left: 20, top: 48 }]} onPress={volver}>
          <Ionicons name="arrow-back" size={22} color={C.primario} />
        </Pressable>
        <Pressable style={[s.btnRedondo, { position: 'absolute', right: 20, top: 48 }]} onPress={() => toggleFavorito(producto.id)}>
          <Ionicons name={esFav ? 'heart' : 'heart-outline'} size={22} color={C.primario} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.etiqueta}><Text style={{ color: C.blanco }}>{producto.categoria}</Text></View>
        <Text style={s.tituloDetalle}>{producto.nombre}</Text>
        <Text style={s.gris}>Marca: {producto.marca}</Text>

        <View style={[s.fila, { marginTop: 8 }]}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => valorar(producto.id, n)}>
              <Ionicons name={n <= Math.round(promedio) ? 'star' : 'star-outline'} size={24} color={C.primario} />
            </Pressable>
          ))}
          <Text style={[s.gris, { marginLeft: 8 }]}>
            {lista.length ? promedio.toFixed(1).replace('.', ',') + ' (' + lista.length + ')' : 'Toca una estrella para calificar'}
          </Text>
        </View>

        {hayVariantes(producto) && (
          <View style={{ marginTop: 14 }}>
            <Text style={[s.gris, { marginBottom: 6 }]}>Elige una variante</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {producto.variantes.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setVarianteId(v.id)}
                  style={[s.chip, { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 }, v.id === varianteId && s.chipOn, v.stock === 0 && { opacity: 0.5 }]}
                >
                  <Text style={[s.chipTxt, v.id === varianteId && { color: C.blanco }]}>{v.etiqueta}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={[s.fila, { justifyContent: 'space-between', marginVertical: 14 }]}>
          <Text style={s.precioGrande}>{(!variante && hayVariantes(producto) ? 'Desde ' : '') + formatoCOP(precioMostrado)}</Text>
          <View style={s.chip}>
            <Text style={s.chipTxt}>
              {variante
                ? variante.stock === 0 ? 'Variante agotada' : 'Disponible - ' + variante.stock + ' unidades'
                : agotado ? 'Agotado' : 'Total: ' + stockTotal(producto) + ' unidades'}
            </Text>
          </View>
        </View>
        <Text style={s.gris}>{producto.descripcion}</Text>
      </ScrollView>

      <View style={{ padding: 20 }}>
        <Pressable disabled={bloqueado} style={[s.boton, bloqueado && { backgroundColor: '#BBBBBB' }]} onPress={() => agregar(producto.id, varianteId)}>
          <Text style={s.botonTxt}>{agotado ? 'Agotado' : sinStockVariante ? 'Variante agotada' : 'Agregar al carrito'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// FAVORITOS
function Favoritos({ productos, favoritos, toggleFavorito, abrirDetalle, irCatalogo }) {
  const lista = productos.filter((p) => favoritos.includes(p.id));
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Favoritos" eslogan="Lo que más te gusta" icono="heart" />
      {lista.length === 0 ? (
        <Vacio icono="heart-outline" mensaje="Aún no tienes favoritos"
            detalle="Toca el corazón en un producto para guardarlo aquí."
            textoBoton="Ir al catálogo" onPress={irCatalogo} />
      ) : (
        <FlatList
          data={lista}
          numColumns={2}
          keyExtractor={(p) => p.id}
          style={{ marginTop: 12 }}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Tarjeta p={item} esFav onFav={() => toggleFavorito(item.id)} onPress={() => abrirDetalle(item)} />
          )}
        />
      )}
    </View>
  );
}

// FILAS DEL RESUMEN
function Resumen({ resumen, hayProductos }) {
  const Fila = ({ a, b, fuerte }) => (
    <View style={[s.fila, { justifyContent: 'space-between', marginVertical: 3 }]}>
      <Text style={[s.resumenTxt, fuerte && s.resumenTotal]}>{a}</Text>
      <Text style={[s.resumenTxt, fuerte && s.resumenTotal]}>{b}</Text>
    </View>
  );
  return (
    <View style={s.cajaResumen}>
      <Fila a="Subtotal" b={formatoCOP(resumen.subtotal)} />
      {resumen.descuento > 0 && <Fila a="Descuento 10 %" b={'-' + formatoCOP(resumen.descuento)} />}
      <Fila a="Envío" b={!hayProductos ? '$0' : resumen.envio === 0 ? 'Gratis' : formatoCOP(resumen.envio)} />
      <View style={{ height: 1, backgroundColor: C.primario, marginVertical: 6 }} />
      <Fila a="Total" b={formatoCOP(resumen.total)} fuerte />
    </View>
  );
}

// CARRITO
function Carrito({ carrito, productos, resumen, agregar, disminuir, eliminar, cuponActivo, aplicarCupon, irCheckout, irCatalogo }) {
  const [codigo, setCodigo] = useState('');
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Mi carrito" eslogan="Revisa tu pedido antes de comprar" icono="cart" />
          {carrito.length === 0 ? (
        <>
          <Vacio icono="cart-outline" mensaje="Tu carrito está vacío"
              detalle="Agrega productos para armar tu pedido."
              textoBoton="Ir al catálogo" onPress={irCatalogo} />
          <View style={{ padding: 20 }}>
            <Resumen resumen={resumen} hayProductos={false} />
          </View>
        </>
      ) : (    
        <>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {carrito.map((l) => {
              const {p, v} = buscarVariante(productos, l.id, l.variante);
              return (
                <View key={l.id + '|' + l.varianteId} style={s.lineaCarrito}>
                  <View style={s.miniRecuadro}><Foto p={p} style={s.fotoMini} inicialesStyle={s.miniIniciales} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.tarjetaNombre}>{p.nombre}</Text>
                    {hayVariantes(p) && <Text style={s.gris}>{v.etiqueta}</Text>} 
                    <Text style={s.precio}>{formatoCOP(v.precio)}</Text>
                    <View style={s.fila}>
                      <Pressable style={[s.btnCant, { backgroundColor: C.suave }]} onPress={() => disminuir(l.id, l.varianteId)}>
                        <Text style={[s.btnCantTxt, { color: C.primario }]}>-</Text>
                      </Pressable>
                      <Text style={s.cantidad}>{l.cantidad}</Text>
                      <Pressable style={[s.btnCant, { backgroundColor: C.primario }]} onPress={() => agregar(l.id, l.varianteId)}>
                        <Text style={[s.btnCantTxt, { color: C.blanco }]}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Pressable style={s.btnRedondo} onPress={() => eliminar(l.id, l.varianteId)}>
                    <Ionicons name="trash-outline" size={22} color={C.primario} />
                  </Pressable>
                </View>
              );
            })}

            <View style={[s.fila, { marginVertical: 8 }]}>
              <TextInput
                style={s.inputCupon}
                placeholder="Cupón de descuento"
                autoCapitalize="characters"
                value={codigo}
                onChangeText={setCodigo}
              />
              <Pressable style={s.botonCupon} onPress={() => aplicarCupon(codigo)}>
                <Text style={s.botonTxt}>Aplicar</Text>
              </Pressable>
            </View>
            {cuponActivo && <Text style={[s.gris, { marginBottom: 6 }]}>Cupón BIENVENIDO10 aplicado</Text>}

            <Resumen resumen={resumen} hayProductos />
          </ScrollView>

          <View style={{ padding: 20 }}>
            <Text style={s.aviso2}>Simulación: no se realiza ningún cobro</Text>
            <Pressable style={s.boton} onPress={irCheckout}>
              <Text style={s.botonTxt}>Continuar con el pago</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

// DATOS DEL COMPRADOR Y REVISION
function Checkout({ carrito, productos, resumen, confirmar, volver }) {
  const [paso, setPaso] = useState('datos'); // 'datos' -> 'revision'
  const [datos, setDatos] = useState({ nombre: '', telefono: '', municipio: '', direccion: '' });
  const [error, setError] = useState('');

  const cambiar = (campo, valor) => setDatos({ ...datos, [campo]: valor });

  const continuar = () => {
    // Un campo con solo espacios cuenta como vacío 
    const faltan = Object.keys(datos).filter((k) => datos[k].trim() === '');
    if (faltan.length > 0) return setError('Falta completar: ' + faltan.join(', '));
    if (!/^\d{7,10}$/.test(datos.telefono.trim())) return setError('El teléfono debe tener entre 7 y 10 números');
    setError('');
    setPaso('revision');
  };

  const campos = [
    ['nombre', 'Nombre completo'],
    ['telefono', 'Teléfono'],
    ['municipio', 'Municipio'],
    ['direccion', 'Dirección'],
  ];

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo={paso === 'datos' ? 'Tus datos' : 'Revisa tu pedido'} onVolver={paso === 'datos' ? volver : () => setPaso('datos')} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {paso === 'datos' ? (
          <>
            {campos.map(([k, etiqueta]) => (
              <TextInput
                key={k}
                style={s.input}
                placeholder={etiqueta}
                value={datos[k]}
                keyboardType={k === 'telefono' ? 'numeric' : 'default'}
                onChangeText={(v) => cambiar(k, v)}
              />
            ))}
            {error !== '' && <Text style={s.error}>{error}</Text>}
          </>
        ) : (
          <>
            <Text style={s.subtitulo}>Entrega</Text>
            <Text style={s.gris}>{datos.nombre} - {datos.telefono}</Text>
            <Text style={[s.gris, { marginBottom: 12 }]}>{datos.direccion}, {datos.municipio}</Text>
            <Text style={s.subtitulo}>Productos</Text>
            {carrito.map((l) => {
              const p = productos.find((x) => x.id === l.id);
              return <Text key={l.id} style={s.gris}>{l.cantidad} x {p.nombre} - {formatoCOP(p.precio * l.cantidad)}</Text>;
            })}
            <View style={{ height: 12 }} />
            <Resumen resumen={resumen} hayProductos />
          </>
        )}
      </ScrollView>
      <View style={{ padding: 20 }}>
        <Text style={s.aviso2}>Simulación: no se realiza ningún cobro</Text>
        {paso === 'datos' ? (
          <Pressable style={s.boton} onPress={continuar}><Text style={s.botonTxt}>Continuar</Text></Pressable>
        ) : (
          <Pressable style={s.boton} onPress={() => confirmar(datos)}><Text style={s.botonTxt}>Confirmar compra</Text></Pressable>
        )}
      </View>
    </View>
  );
}

// CONFIRMACION
function Confirmacion({ pedido, irCatalogo, irHistorial }) {
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="¡Pedido confirmado!" />
      <View style={s.vacio}>
        <Ionicons name="checkmark-circle" size={80} color={C.primario} />
        <Text style={s.subtitulo}>Código: {pedido.codigo}</Text>
        <Text style={s.vacioTxt}>Total: {formatoCOP(pedido.total)}</Text>
        <Text style={s.vacioTxt}>Esto es una simulación: no se realizó ningún cobro real.</Text>
        <Pressable style={s.boton} onPress={irHistorial}><Text style={s.botonTxt}>Ver mi historial</Text></Pressable>
        <Pressable style={{ marginTop: 14 }} onPress={irCatalogo}><Text style={{ color: C.primario, fontWeight: 'bold' }}>Seguir comprando</Text></Pressable>
      </View>
    </View>
  );
}

// HISTORIAL Y DETALLE DEL PEDIDO
function Historial({ pedidos, irCatalogo }) {
  const [sel, setSel] = useState(null);

  if (sel) {
    return (
      <View style={{ flex: 1 }}>
        <Encabezado titulo="Detalle del pedido" onVolver={() => setSel(null)} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={s.subtitulo}>{sel.codigo}</Text>
          <Text style={[s.gris, { marginBottom: 12 }]}>{sel.fecha}</Text>
          {sel.items.map((it, i) => (
            <Text key={i} style={s.gris}>{it.cantidad} x {it.nombre} ({formatoCOP(it.precioUnit)} c/u) - {formatoCOP(it.cantidad * it.precioUnit)}</Text>
          ))}
          <View style={{ height: 12 }} />
          <Resumen resumen={sel} hayProductos />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Historial" eslogan="Tus pedidos confirmados" icono="time" />
      {pedidos.length === 0 ? (
        <Vacio icono="time-outline" mensaje="No hay pedidos registrados"
             detalle="Cuando confirmes una compra, aparecerá aquí."
             textoBoton="Ir al catálogo" onPress={irCatalogo} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(p) => p.codigo}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable style={s.lineaCarrito} onPress={() => setSel(item)}>
              <View style={{ flex: 1 }}>
                <Text style={s.tarjetaNombre}>{item.codigo}</Text>
                <Text style={s.gris}>{item.fecha}</Text>
              </View>
              <Text style={s.precio}>{formatoCOP(item.total)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

// PANEL DE VENDEDOR 
function Vendedor({ productos, guardar }) {
  const formVacio = { nombre: '', categoria: 'Hogar', precio: '', stock: '', descripcion: '' };
  const sinError = { campo: '', motivo: '' };
  const [form, setForm] = useState(formVacio);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(sinError);
  const categorias = CATEGORIAS.filter((c) => c !== 'Todas');

  const cambiar = (campo, valor) => setForm({ ...form, [campo]: valor });

  // Devuelve si hay un error, o null si todo está bien
  const validar = () => {
    const precio = Number(form.precio);
    const stock = Number(form.stock);
    if (form.nombre.trim() === '')
      return { campo: 'nombre', motivo: 'El nombre no puede estar vacío' };
    if (!/^\d+$/.test(form.precio.trim()) || precio <= 0)
      return { campo: 'precio', motivo: 'El precio debe ser un número entero mayor que 0' };
    if (!/^\d+$/.test(form.stock.trim()))
      return { campo: 'stock', motivo: 'El stock debe ser un número entero de 0 o más' };
    if (form.descripcion.trim().length < 15)
      return { campo: 'descripcion', motivo: 'La descripción debe tener al menos 15 caracteres' };
    return null;
  };

  // Borde rojo en el campo que falló
  const rojo = (campo) => (error.campo === campo ? { borderColor: '#B00020' } : null);

  const guardarForm = () => {
    const fallo = validar();
    if (fallo) return setError(fallo);
    setError(sinError);
    guardar(
      {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precio: Number(form.precio),
        stock: Number(form.stock),
        descripcion: form.descripcion.trim(),
      },
      editId
    );
    setForm(formVacio);
    setEditId(null);
  };

  const editar = (p) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: String(p.precio), stock: String(p.stock), descripcion: p.descripcion });
    setError(sinError);
  };

  const cancelar = () => {
    setEditId(null);
    setForm(formVacio);
    setError(sinError);
  };

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Panel de vendedor" eslogan="Crea y edita tus productos" icono="storefront" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.subtitulo}>{editId ? 'Editando ' + editId : 'Nuevo producto'}</Text>

        <TextInput style={[s.input, rojo('nombre')]} placeholder="Nombre del producto" value={form.nombre} onChangeText={(v) => cambiar('nombre', v)} />
        <TextInput style={[s.input, rojo('precio')]} placeholder="Precio en COP (ej. 25000)" keyboardType="numeric" value={form.precio} onChangeText={(v) => cambiar('precio', v)} />
        <TextInput style={[s.input, rojo('stock')]} placeholder="Stock (unidades)" keyboardType="numeric" value={form.stock} onChangeText={(v) => cambiar('stock', v)} />
        <TextInput
          style={[s.input, { height: 90, paddingTop: 12, textAlignVertical: 'top' }, rojo('descripcion')]}
          placeholder="Descripción (mínimo 15 caracteres)"
          multiline
          value={form.descripcion}
          onChangeText={(v) => cambiar('descripcion', v)}
        />

        <Text style={[s.gris, { marginBottom: 6 }]}>Categoría</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {categorias.map((c) => (
        <Pressable key={c} onPress={() => cambiar('categoria', c)} style={[s.chip, { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 }, c === form.categoria && s.chipOn]}>
              <Text style={[s.chipTxt, c === form.categoria && { color: C.blanco }]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        {error.motivo !== '' && <Text style={[s.error, { marginBottom: 8 }]}>{error.motivo}</Text>}

        <Pressable style={s.boton} onPress={guardarForm}>
          <Text style={s.botonTxt}>{editId ? 'Guardar cambios' : 'Crear producto'}</Text>
        </Pressable>
        {editId && (
          <Pressable style={{ alignItems: 'center', marginTop: 12 }} onPress={cancelar}>
            <Text style={{ color: C.primario, fontWeight: 'bold' }}>Cancelar edición</Text>
          </Pressable>
        )}

        <Text style={[s.subtitulo, { marginTop: 24 }]}>Mis productos ({productos.length})</Text>
        {productos.map((p) => (
          <View key={p.id} style={s.lineaCarrito}>
            <View style={{ flex: 1 }}>
              <Text style={s.tarjetaNombre}>{p.nombre}</Text>
              <Text style={s.gris}>{p.id} - {p.categoria} - Stock: {p.stock}</Text>
              <Text style={s.precio}>{formatoCOP(p.precio)}</Text>
            </View>
            <Pressable style={s.btnRedondo} onPress={() => editar(p)}>
              <Ionicons name="create-outline" size={22} color={C.primario} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// APP PRINCIPAL ESTADOS Y NAVEGACION
const TABS = [
  { id: 'catalogo', nombre: 'Catálogo', icono: 'home-outline' },
  { id: 'favoritos', nombre: 'Favoritos', icono: 'heart-outline' },
  { id: 'carrito', nombre: 'Carrito', icono: 'cart-outline' },
  { id: 'historial', nombre: 'Historial', icono: 'time-outline' },
  { id: 'vendedor', nombre: 'Vendedor', icono: 'storefront-outline' },
];

export default function App() {
  // Estados: todo vive en memoria (useState)
  const [fuentesListas] = useFonts({ Fredoka_700Bold });
  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [carrito, setCarrito] = useState([]);        
  const [favoritos, setFavoritos] = useState([]);     
  const [pedidos, setPedidos] = useState([]);
  const [valoraciones, setValoraciones] = useState({}); 
  const [pantalla, setPantalla] = useState('catalogo');
  const [anterior, setAnterior] = useState('catalogo');
  const [productoSel, setProductoSel] = useState(null);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [cuponActivo, setCuponActivo] = useState(false);
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [orden, setOrden] = useState('asc');
  const mostrarBarra = ['catalogo', 'favoritos', 'carrito', 'historial', 'vendedor'].includes(pantalla);


  const avisar = (txt) => {
    setAviso(txt);
    setTimeout(() => setAviso(''), 2000);
  };

  const abrirDetalle = (p) => {
    setAnterior(pantalla);
    setProductoSel(p);
    setPantalla('detalle');
  };

  const toggleFavorito = (id) =>
    setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // AGREGAR: aumentar validando stock y tambien recibe la variante
  const agregar = (id, varianteId) => {
    if (!varianteId) return avisar('Elige una variante antes de agregar al carrito');
    const { v } = buscarVariante(productos, id, varianteId);
    const linea = carrito.find((l) => l.id === id && l.varianteId === varianteId);
    const enCarrito = linea ? linea.cantidad : 0;
    if (v.stock === 0) return avisar('Esta variante está agotada');
    if (enCarrito >= v.stock) return avisar('Máximo permitido: ' + v.stock + ' unidades de esta variante');
    setCarrito(
      linea
        ? carrito.map((l) => (l.id === id && l.varianteId === varianteId ? { ...l, cantidad: l.cantidad + 1 } : l))
        : [...carrito, { id, varianteId, cantidad: 1 }]
    );
    avisar('Producto agregado al carrito');
  };

  // Al llegar a 0 la línea se elimina (nunca hay cantidades negativas)
   const disminuir = (id, varianteId) =>
    setCarrito(
      carrito
        .map((l) => (l.id === id && l.varianteId === varianteId ? { ...l, cantidad: l.cantidad - 1 } : l))
        .filter((l) => l.cantidad > 0)
    );

  const eliminar = (id, varianteId) => {
    setCarrito(carrito.filter((l) => !(l.id === id && l.varianteId === varianteId)));
    avisar('Producto eliminado');
  };

  // único cupón de prueba
  const aplicarCupon = (codigo) => {
    if (codigo.trim().toUpperCase() === 'BIENVENIDO10') {
      setCuponActivo(true);
      avisar('Cupón aplicado');
    } else {
      avisar('Cupón no válido');
    }
  };

  // valoración entera de 1 a 5
  const valorar = (id, n) => {
    if (!Number.isInteger(n) || n < 1 || n > 5) return avisar('La valoración debe ser de 1 a 5');
    setValoraciones({ ...valoraciones, [id]: [...(valoraciones[id] || []), n] });
    avisar('¡Gracias por tu valoración!');
  };

  // crear o editar un roducto
  const confirmarCompra = (datos) => {
    if (carrito.length === 0) return avisar('Tu carrito está vacío');
    for (const l of carrito) {
      const { p, v } = buscarVariante(productos, l.id, l.varianteId);
      if (l.cantidad > v.stock) return avisar('Sin stock suficiente de ' + p.nombre + ' (' + v.etiqueta + ')');
    }
    const pedido = {
      codigo: 'ZV-' + Date.now(),
      fecha: new Date().toLocaleString('es-CO'),
      comprador: datos,
      items: carrito.map((l) => {
        const { p, v } = buscarVariante(productos, l.id, l.varianteId);
        return { id: p.id, varianteId: v.id, nombre: p.nombre, etiqueta: v.etiqueta, cantidad: l.cantidad, precioUnit: v.precio };
      }),
      ...resumen,
    };
    //guardar pedido y vaciar carrito
    setProductos(
      productos.map((p) => ({
        ...p,
        variantes: p.variantes.map((v) => {
          const l = carrito.find((x) => x.id === p.id && x.varianteId === v.id);
          return l ? { ...v, stock: v.stock - l.cantidad } : v;
        }),
      }))
    );
    setPedidos([pedido, ...pedidos]);
    setUltimoPedido(pedido);
    setCarrito([]);
    setCuponActivo(false);
    setPantalla('confirmacion');
  };

  const irCatalogo = () => setPantalla('catalogo');

  if (!fuentesListas) return null;
  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <StatusBar barStyle="light-content" />

      {pantalla === 'catalogo' && (
        <Catalogo
          productos={productos} favoritos={favoritos} toggleFavorito={toggleFavorito} abrirDetalle={abrirDetalle}
          busqueda={busqueda} setBusqueda={setBusqueda} categoria={categoria} setCategoria={setCategoria}
          orden={orden} setOrden={setOrden}
        />
      )}
      {pantalla === 'detalle' && productoSel && (
        <Detalle
          producto={productos.find((p) => p.id === productoSel.id)}
          esFav={favoritos.includes(productoSel.id)} toggleFavorito={toggleFavorito} agregar={agregar}
          volver={() => setPantalla(anterior)} valoraciones={valoraciones} valorar={valorar}
        />
      )}
      {pantalla === 'favoritos' && (
        <Favoritos productos={productos} favoritos={favoritos} toggleFavorito={toggleFavorito} abrirDetalle={abrirDetalle} irCatalogo={irCatalogo} />
      )}
      {pantalla === 'carrito' && (
        <Carrito
          carrito={carrito} productos={productos} resumen={resumen} agregar={agregar} disminuir={disminuir}
          eliminar={eliminar} cuponActivo={cuponActivo} aplicarCupon={aplicarCupon}
          irCheckout={() => setPantalla('checkout')} irCatalogo={irCatalogo}
        />
      )}
      {pantalla === 'checkout' && (
        <Checkout carrito={carrito} productos={productos} resumen={resumen} confirmar={confirmarCompra} volver={() => setPantalla('carrito')} />
      )}
      {pantalla === 'confirmacion' && ultimoPedido && (
        <Confirmacion pedido={ultimoPedido} irCatalogo={irCatalogo} irHistorial={() => setPantalla('historial')} />
      )}
      {pantalla === 'historial' && <Historial pedidos={pedidos} irCatalogo={irCatalogo} />}
      {pantalla === 'vendedor' && <Vendedor productos={productos} guardar={guardarProducto} />} 

      {aviso !== '' && (
        <View style={s.toast}><Text style={s.toastTxt}>{aviso}</Text></View>
      )}

      {mostrarBarra && (
        <View style={s.barra}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setPantalla(t.id)} style={{ alignItems: 'center' }}>
              <Ionicons name={t.icono} size={26} color={pantalla === t.id ? C.primario : C.texto} />
              <Text style={{ fontSize: 12, color: pantalla === t.id ? C.primario : C.texto }}>{t.nombre}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ESTILOS 
const s = StyleSheet.create({
  fila: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  gris:  { 
    color: C.gris, 
    fontSize: 14 
  },
  encabezado: { 
    backgroundColor: C.primario, 
    paddingTop: 48, 
    paddingHorizontal: 20, 
    paddingBottom: 24, 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32,
    overflow: 'hidden' 
  },
  circuloGrande: {
  position: 'absolute', top: -60, right: -40,
  width: 180, height: 180, borderRadius: 90,
  backgroundColor: 'rgba(255,255,255,0.12)',
},
circuloPequeno: {
  position: 'absolute', bottom: -30, right: 90,
  width: 90, height: 90, borderRadius: 45,
  backgroundColor: 'rgba(255,255,255,0.10)',
},
iconoEnc: {
  width: 48, height: 48, borderRadius: 24,
  backgroundColor: C.blanco,
  alignItems: 'center', justifyContent: 'center',
  marginRight: 12,
},
  marca: { 
    color: C.blanco, 
    fontSize: 32, 
    fontFamily: 'Fredoka_700Bold'
  },
  eslogan: { 
    color: C.blanco, 
    fontSize: 13 
  },
  btnRedondo: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: C.blanco, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  buscador: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.blanco, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    marginTop: 14, 
    height: 44 
  },
  inputBuscar: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 15 
  },
  chips: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 8 
  },
  chip: { 
    borderWidth: 1.5, 
    borderColor: C.primario, 
    borderRadius: 14, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    backgroundColor: C.blanco 
  },
  chipOn: { 
    backgroundColor: C.primario 
  },
  chipTxt: { 
    color: C.primario, 
    fontWeight: '600' 
  },
  tarjeta: { 
    width: '47%', 
    backgroundColor: C.blanco, 
    borderRadius: 16, 
    marginBottom: 16, 
    overflow: 'hidden' 
  },
  recuadro: { 
    aspectRatio: 1,
    backgroundColor: C.suave, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  iniciales: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: C.primario 
  },
  agotado: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    backgroundColor: '#000', 
    color: C.blanco, 
    fontSize: 11, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 8, 
    overflow: 'hidden' 
  },
  corazon: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    width: 32, 
    height: 32,
    borderRadius: 16, 
    backgroundColor: C.blanco, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  tarjetaNombre: { 
    fontWeight: 'bold', 
    fontSize: 14, 
    color: C.texto 
  },
  precio: { 
    color: C.primario, 
    fontWeight: 'bold', 
    fontSize: 15, 
    marginTop: 2
  },
  heroDetalle: { 
    height: 260, 
    backgroundColor: C.primario, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  inicialesGrandes: { 
    fontSize: 80,
    fontWeight: 'bold', 
    color: C.suave 
  },
  etiqueta: { 
    alignSelf: 'flex-start', 
    backgroundColor: C.primario, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 4 
  },
  tituloDetalle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginVertical: 8, 
    color: C.texto 
  },
  precioGrande: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: C.primario 
  },
  botonTxt: { 
    color: C.blanco, 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  vacio: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 30 
  },
  vacioTxt: { 
    color: C.gris, 
    fontSize: 16, 
    textAlign: 'center', 
    marginVertical: 12 
  },
  circuloVacio: {
     width: 120, 
     height: 120, 
     borderRadius: 60,
     backgroundColor: C.suave,
     alignItems: 'center', 
     justifyContent: 'center',
    marginBottom: 20,
},
vacioTitulo: {
    fontSize: 20, 
    fontWeight: 'bold',
    color: C.texto, 
    textAlign: 'center',
},
boton: {
    backgroundColor: C.primario,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
},
  lineaCarrito: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.blanco, 
    borderRadius: 18, 
    padding: 14, 
    marginBottom: 12 
  },
  miniRecuadro: { 
    width: 64, 
    height: 64, 
    borderRadius: 14, 
    backgroundColor: C.suave, 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden'
  },
  miniIniciales: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: C.primario 
  },
  btnCant: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnCantTxt: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  cantidad: { 
    marginHorizontal: 14, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  inputCupon: { 
    flex: 1, 
    borderWidth: 1.5, 
    borderColor: C.primario, 
    borderRadius: 12, 
    backgroundColor: C.blanco, 
    paddingHorizontal: 12, 
    height: 44, 
    marginRight: 8 
  },
  botonCupon: { 
    backgroundColor: C.primario, 
    borderRadius: 12, 
    paddingHorizontal: 18, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cajaResumen: { 
    backgroundColor: C.blanco, 
    borderRadius: 18, 
    padding: 16 
  },
  resumenTxt: { 
    fontSize: 15, 
    color: C.texto 
  },
  resumenTotal: { 
    color: C.primario, 
    fontWeight: 'bold', 
    fontSize: 17 
  },
  aviso2: { 
    textAlign: 'center', 
    color: C.gris, 
    fontSize: 12, 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: C.blanco, 
    borderRadius: 12,
    borderWidth: 1.5, 
    borderColor: C.primario, 
    paddingHorizontal: 14, 
    height: 48, 
    marginBottom: 12, 
    fontSize: 15 
  },
  error: { 
    color: '#B00020', 
    fontSize: 14, 
    marginTop: 4 
  },
  subtitulo: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: C.primario, 
    marginBottom: 4 
  },
  toast: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    right: 20, 
    backgroundColor: '#222', 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center' 
},
  toastTxt: { 
    color: C.blanco, 
    fontSize: 14 
  },
  barra: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: C.blanco, 
    paddingVertical: 10, 
    paddingBottom: 16 
  },
  fotoTarjeta: { 
    width: '100%', 
    height: '100%' 
  },
  fotoMini: { 
    width: '100%', 
    height: '100%' 
  },
  fotoHero: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%' },
});