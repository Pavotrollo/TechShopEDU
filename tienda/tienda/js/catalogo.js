// ==========================================================
// CATÁLOGO
// - Productos con variantes
// - Buscador en tiempo real
// - Filtros por categoría
// - Botón "Agregar al carrito" (localStorage)
//
// Cada producto se guarda en localStorage (clave 'carrito') así:
// { id, nombre, variante: "30 W", precio, cantidad, imagen, stock }
// ==========================================================

// Usamos una función anónima autoejecutable (() => { ... })()
// Evitar que las variables se mezclen e interfieran con las de otros archivos
(() => {
// Guardamos en variables los elementos del HTML con los que vamos a interactuar
const buscador = document.getElementById('buscador'); //obtiene el input de busqueda
const botonesFiltro = document.querySelectorAll('.filtro'); //obtine los botones de categoría
const contenedor = document.getElementById('lista-productos'); //obtiene el contenedor de productos
const mensajeVacio = document.getElementById('sin-resultados'); //obtiene el mensaje de sin resultados

// Si no estamos en la página del catálogo (y el contenedor no existe),se detiene
if (!contenedor) return; 

// Por default iniciamos mostrando todos los productos
let categoriaActiva = 'todos';

// Lee los selectores de una tarjeta y devuelve la variante elegida y su precio
function leerSeleccion(producto, tarjeta) {
  const valores = []; //Variante seleccionada del producto
  const indices = []; //Indice de la variante seleccionada del producto
  let precio = producto.precio; //Precio base del producto

  //Revisa si el producto tiene variantes
  tarjeta.querySelectorAll('select[data-variante]').forEach((selector) => {
    //Busca el indice de la variante y la opcion seleccionada
    const indiceVariante = selector.dataset.variante; 
    const indiceOpcion = selector.value; 
    //Obtiene la variante y la opcion seleccionada
    const variante = producto.variantes[Number(indiceVariante)];
    const opcion = variante.opciones[Number(indiceOpcion)];
    //Agrega el valor de la opcion seleccionada al arreglo de valores
    valores.push(opcion.valor);
    //Agrega el indice de la opcion seleccionada al arreglo de indices
    indices.push(indiceVariante + ':' + indiceOpcion);
    //Suma el precio extra de la opcion seleccionada al precio base
    precio += opcion.extra;
  });

  //Devuelve la seleccion especial del producto
  return { variante: valores.join(', '), varianteId: indices.join(','), precio: precio };
}

// ---------- Dibujar el catálogo ----------
function crearTarjeta(producto) {
  //Crea la tarjeta
  const tarjeta = document.createElement('article');
  tarjeta.className = 'producto card';
  //Guarda la informacion de la tarjeta en la tarjeta
  tarjeta.dataset.id = producto.id;
  tarjeta.dataset.categoria = producto.categoria;
  tarjeta.dataset.nombre = producto.nombre;
  tarjeta.dataset.precio = producto.precio;
  tarjeta.dataset.stock = producto.stock;
  tarjeta.dataset.img = producto.imagen;

  //Crea los selectores de variantes
  const selectoresHtml = producto.variantes.map((variante, i) => {
    const idSelector = 'var-' + producto.id + '-' + i; //Crea un id para cada selector
    //Crea las opciones para cada selector
    const opcionesHtml = variante.opciones.map((opcion, j) => {
      const sufijo = opcion.extra > 0 ? ' (+$' + opcion.extra + ')' : '';
      return '<option value="' + j + '">' + escaparHTML(opcion.valor) + sufijo + '</option>';
    }).join('');

    //Devuelve el selector de variantes en formato HTML
    return (
      '<div class="variante">' +
        '<label for="' + idSelector + '">' + escaparHTML(variante.nombre) + '</label>' +
        '<select class="form-select" id="' + idSelector + '" data-variante="' + i + '">' + opcionesHtml + '</select>' +
      '</div>'
    );
  }).join('');

  //Aplica la clase stock--bajo si el stock es menor o igual a 10
  const stockClase = producto.stock <= 10 ? 'stock stock--bajo' : 'stock';
  //Aplica la clase producto__img--contener si el producto tiene la propiedad contener
  const imgClase = producto.contener ? ' class="producto__img--contener"' : '';

  //Devuelve la tarjeta en formato HTML
  tarjeta.innerHTML =
    '<img' + imgClase + ' src="' + escaparHTML(producto.imagen) + '" alt="' + escaparHTML(producto.alt) + '" loading="lazy">' +
    '<div class="producto__cuerpo card-body">' +
      '<span class="etiqueta">' + escaparHTML(CATEGORIAS[producto.categoria]) + '</span>' +
      '<h3>' + escaparHTML(producto.nombre) + '</h3>' +
      '<p>' + escaparHTML(producto.descripcion) + '</p>' +
      selectoresHtml +
      '<div class="producto__pie">' +
        '<strong class="precio" data-precio>' + formatearPrecio(producto.precio) + ' <small>MXN</small></strong>' +
        '<span class="' + stockClase + '">' + producto.stock + ' en stock</span>' +
      '</div>' +
      '<button class="btn btn--agregar" type="button" data-accion="agregar">Agregar al carrito</button>' +
    '</div>';

  // Si la foto todavía no existe, se muestra la imagen provisional
  const img = tarjeta.querySelector('img');
  img.addEventListener('error', () => {
    img.src = imagenProvisional(producto.nombre);
  }, { once: true });

  return tarjeta;
}

// Oculta o muestra las tarjetas por categoría o búsqueda
function aplicarFiltros() {
  const termino = normalizar(buscador.value); // Valor de la barra de búsqueda
  let visibles = 0; 

  // Busca coincidencias en el nombre y la descripción de la tarjeta
  contenedor.querySelectorAll('.producto').forEach((tarjeta) => {
    // Obtiene nombre y descripción de la tarjeta
    const textoProducto = normalizar(
      tarjeta.dataset.nombre + ' ' + tarjeta.querySelector('.producto__cuerpo > p').textContent
    );

    // Coincide categoria
    const coincideCategoria =
      categoriaActiva === 'todos' || tarjeta.dataset.categoria === categoriaActiva;
    // Coincide busqueda
    const coincideBusqueda = textoProducto.includes(termino);

    // Muestra el producto si cumple ambas condiciones
    const mostrar = coincideCategoria && coincideBusqueda;
    tarjeta.hidden = !mostrar; // Si no, lo oculta
    
    if (mostrar) visibles++; // Suma 1 a productos visibles
  });

  // Si no hay productos visibles, muestra mensaje de “sin resultados”
  mensajeVacio.hidden = visibles !== 0;
}

// ---------- Agregar al carrito (localStorage) ----------

function agregarAlCarrito(producto, tarjeta) {
  const seleccion = leerSeleccion(producto, tarjeta);

  try {
    let carrito = obtener('carrito');
    if (!Array.isArray(carrito)) carrito = [];

    // No se puede pedir más piezas de las que hay en stock (suma todas las variantes)
    const yaEnCarrito = carrito
      .filter((item) => item.id === producto.id)
      .reduce((total, item) => total + item.cantidad, 0);

    if (yaEnCarrito >= producto.stock) {
      mostrarAviso('Stock agotado', 'Ya tienes en el carrito las ' + producto.stock + ' piezas disponibles de ' + producto.nombre + '.', false);
      return;
    }

    // Si ya existe el mismo producto con la misma variante, solo sube la cantidad
    const existente = carrito.find(
      (item) => item.id === producto.id && (item.varianteId === seleccion.varianteId || item.variante === seleccion.variante)
    );

    if (existente) {
      existente.cantidad += 1;
      existente.varianteId = seleccion.varianteId; // Actualiza al nuevo formato
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        variante: seleccion.variante,
        varianteId: seleccion.varianteId,
        cantidad: 1,
        imagen: producto.imagen,
        stock: producto.stock
      });
    }

    guardar('carrito', carrito);
    actualizarContadorCarrito();
    mostrarAviso('Agregado al carrito', producto.nombre + ' (' + seleccion.variante + ')', true);
  } catch (error) {
    mostrarAviso('No se pudo agregar', 'Tu navegador no permite guardar datos. Revisa que localStorage esté habilitado.', false);
  }
}

// Aviso (toast de Bootstrap) después de agregar un producto
function mostrarAviso(titulo, mensaje, exito) {
  document.getElementById('aviso-titulo').textContent = titulo;
  document.getElementById('aviso-texto').textContent = mensaje;
  document.getElementById('aviso-enlace').hidden = !exito;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('aviso-carrito'), { delay: 4000 }).show();
}

// ---------- Eventos ----------

// Generamos y mostramos todas las tarjetas de los productos al cargar la página
PRODUCTOS.forEach((producto) => contenedor.appendChild(crearTarjeta(producto)));

// Ejecutamos la función de filtros cada vez que el usuario escribe en el buscador
buscador.addEventListener('input', aplicarFiltros);

// Le damos vida a los botones de categoría (Filtros)
botonesFiltro.forEach((boton) => {
  boton.addEventListener('click', () => {
    categoriaActiva = boton.dataset.categoria; // Actualizamos la categoría elegida

    // Remarcamos visualmente el botón que fue clickeado y desmarcamos los demás
    botonesFiltro.forEach((b) => {
      const activo = b === boton;
      b.classList.toggle('is-activo', activo);
      b.setAttribute('aria-pressed', activo);
    });

    aplicarFiltros(); // Volvemos a filtrar los productos con la nueva categoría
  });
});

// Detectamos cuando el usuario cambia una opción (ej. color) para actualizar el precio
contenedor.addEventListener('change', (evento) => {
  if (!evento.target.matches('select[data-variante]')) return;
  
  const tarjeta = evento.target.closest('.producto');
  const producto = buscarProducto(tarjeta.dataset.id);
  const seleccion = leerSeleccion(producto, tarjeta);
  
  // Imprimimos el nuevo precio calculado en la tarjeta
  tarjeta.querySelector('[data-precio]').innerHTML = formatearPrecio(seleccion.precio) + ' <small>MXN</small>';
});

// Detectamos clics en los botones "Agregar al carrito"
contenedor.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-accion="agregar"]');
  if (!boton) return; // Si no se clickeó el botón de agregar, ignoramos el clic
  
  const tarjeta = boton.closest('.producto');
  agregarAlCarrito(buscarProducto(tarjeta.dataset.id), tarjeta);
});

})();
