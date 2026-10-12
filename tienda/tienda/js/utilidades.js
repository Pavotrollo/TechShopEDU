// ==========================================================
// UTILIDADES COMPARTIDAS
// Funciones globales usadas en todas las páginas (catálogo, carrito, checkout)
// Manejo de localStorage, formateo de precios, seguridad y catálogo de productos
// ==========================================================

// ---------- Almacenamiento Local (localStorage) ----------
// localStorage guarda datos en el navegador del usuario para no perderlos al recargar.
// Como solo guarda texto, usamos JSON para convertir objetos y listas.

// Lee datos de localStorage y los convierte de texto a objeto/arreglo
function obtener(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || [];
  } catch (error) {
    // Si hay error, devuelve un arreglo vacío
    return [];
  }
}

// Convierte un objeto o arreglo a texto (JSON) y lo guarda en localStorage
function guardar(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch (error) {
    console.warn('No se pudo guardar en localStorage:', error);
  }
}

// ---------- Formateo y Utilidades Generales ----------

// Formato de moneda en pesos MXN
function formatearPrecio(numero) {
  return '$' + Number(numero).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Normaliza el texto
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD') // Separa las letras de sus acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .trim(); // Quita espacios al inicio y al final
}

// Escapa caracteres especiales
function escaparHTML(texto) {
  if (texto === undefined || texto === null) return '';
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Genera una imagen de respaldo para productos sin foto
function imagenProvisional(nombre) {
  const texto = nombre.replace(/[<>&"]/g, '');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#eef1ef"/>' +
    '<rect x="150" y="90" width="100" height="70" rx="8" fill="none" stroke="#0e6b52" stroke-width="4"/>' +
    '<path d="M165 90v-16M185 90v-16M205 90v-16M225 90v-16M165 160v16M185 160v16M205 160v16M225 160v16" stroke="#0e6b52" stroke-width="4"/>' +
    '<text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#14212e">' + texto + '</text>' +
    '<text x="200" y="245" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#46566a">Foto pendiente</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ---------- Contador del Carrito ----------

// Suma la cantidad de piezas de todos los productos en el carrito
function contarProductosCarrito() {
  const carrito = obtener('carrito'); //obtiene el carrito de localstorage
  if (!Array.isArray(carrito)) return 0; 
  return carrito.reduce((total, producto) => total + (Number(producto.cantidad) || 0), 0);
}

// Actualiza el número que se muestra en la burbuja del carrito
function actualizarContadorCarrito() {
  const contador = document.getElementById('cart-badge'); //obtiene la burbuja
  if (contador) contador.textContent = contarProductosCarrito();
}

// Actualiza el número del carrito apenas termina de cargar el HTML
document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);

// Si el usuario cambia el carrito en otra pestaña, actualiza el número automáticamente
window.addEventListener('storage', actualizarContadorCarrito);

// ==========================================================
// DATOS DEL CATÁLOGO
// Lista de categorías y productos disponibles en la tienda
// ==========================================================

// Diccionario con los nombres de cada categoría
const CATEGORIAS = {
  microcontroladores: 'Microcontroladores',
  sensores: 'Sensores',
  prototipado: 'Prototipado',
  herramientas: 'Herramientas'
};

// Arreglo con todos los productos de la tienda
const PRODUCTOS = [
  {
    id: 'arduino-uno', categoria: 'microcontroladores', nombre: 'Arduino UNO R3',
    descripcion: 'Placa con ATmega328P, 14 pines digitales y 6 entradas analógicas. Ideal para aprender programación física.',
    precio: 289, stock: 14, imagen: 'img/arduino-uno.jpg', alt: 'Placa Arduino UNO R3',
    variantes: [
      { nombre: 'Paquete', opciones: [{ valor: 'Solo placa', extra: 0 }, { valor: 'Con cable USB', extra: 35 }] }
    ]
  },
  {
    id: 'esp32', categoria: 'microcontroladores', nombre: 'Placa ESP32 WROOM',
    descripcion: 'Microcontrolador de doble núcleo con Wi-Fi y Bluetooth integrados para proyectos de internet de las cosas.',
    precio: 199, stock: 22, imagen: 'img/esp32.jpg', alt: 'Placa ESP32 WROOM con Wi-Fi y Bluetooth',
    variantes: [
      { nombre: 'Versión', opciones: [{ valor: '30 pines', extra: 0 }, { valor: '38 pines', extra: 20 }] }
    ]
  },
  {
    id: 'sensor-movimiento', categoria: 'sensores', nombre: 'Sensor de movimiento PIR',
    descripcion: 'Detecta movimiento por infrarrojos pasivos. Alcance ajustable, perfecto para alarmas y luces automáticas.',
    precio: 89, stock: 30, imagen: 'img/sensor-movimiento.jpg', alt: 'Sensor de movimiento PIR con pantalla de segmentos',
    variantes: [
      { nombre: 'Alcance', opciones: [{ valor: '3 m', extra: 0 }, { valor: '7 m', extra: 30 }] }
    ]
  },
  {
    id: 'sensor-optico', categoria: 'sensores', nombre: 'Sensor óptico reflectivo',
    descripcion: 'Mide presencia y distancia corta con luz infrarroja. Útil para robots seguidores de línea y contadores.',
    precio: 119, stock: 18, imagen: 'img/sensor-optico.jpg', alt: 'Sensor óptico reflectivo con cables',
    variantes: [
      { nombre: 'Salida', opciones: [{ valor: 'Digital', extra: 0 }, { valor: 'Analógica', extra: 25 }] }
    ]
  },
  {
    id: 'protoboard', categoria: 'prototipado', nombre: 'Protoboard 830 puntos',
    descripcion: 'Arma y prueba circuitos sin soldar. Incluye rieles de alimentación positivo y negativo.',
    precio: 79, stock: 40, imagen: 'img/Protoboard.jpg', alt: 'Protoboard blanca con rieles de alimentación',
    variantes: [
      { nombre: 'Presentación', opciones: [{ valor: 'Individual', extra: 0 }, { valor: 'Paquete de 3', extra: 158 }] }
    ]
  },
  {
    id: 'cables', categoria: 'prototipado', nombre: 'Kit de cables y conectores',
    descripcion: 'Cable plano multicolor, arneses y conectores para conectar placas, sensores y módulos.',
    precio: 59, stock: 35, imagen: 'img/cables.jpg', alt: 'Cable plano de colores y conectores',
    variantes: [
      { nombre: 'Tipo de cable', opciones: [{ valor: 'Cable plano', extra: 0 }, { valor: 'Jumpers macho-hembra', extra: 20 }] }
    ]
  },
  {
    id: 'cautin', categoria: 'herramientas', nombre: 'Cautín con soporte y estaño',
    descripcion: 'Cautín de punta fina con base, esponja de limpieza y estaño con núcleo de resina de 0.8 mm.',
    precio: 249, stock: 9, imagen: 'img/cautin-estano.jpg', alt: 'Cautín con soporte, esponja metálica y rollo de estaño',
    variantes: [
      { nombre: 'Potencia', opciones: [{ valor: '30 W', extra: 0 }, { valor: '60 W', extra: 90 }] }
    ]
  },
  {
    id: 'desatornillador', categoria: 'herramientas', nombre: 'Desatornillador de precisión',
    descripcion: 'Mango ergonómico antideslizante, para tornillos pequeños de electrónica.',
    precio: 65, stock: 25, imagen: 'img/desatornillador.jpg', alt: 'Desatornillador de precisión con mango azul',
    contener: true,
    variantes: [
      { nombre: 'Punta', opciones: [{ valor: 'Plana 1.5 x 50 mm', extra: 0 }, { valor: 'Phillips PH0', extra: 0 }] }
    ]
  },
  {
    id: 'raspberry-pico', categoria: 'microcontroladores', nombre: 'Raspberry Pi Pico',
    descripcion: 'Microcontrolador de bajo costo con chip RP2040, programable en MicroPython y C.',
    precio: 119, stock: 16, imagen: 'img/raspberry-pico.jpg', alt: 'Placa Raspberry Pi Pico',
    variantes: [
      { nombre: 'Versión', opciones: [{ valor: 'Pico', extra: 0 }, { valor: 'Pico W (Wi-Fi)', extra: 60 }] }
    ]
  },
  {
    id: 'sensor-dht', categoria: 'sensores', nombre: 'Sensor de temperatura y humedad',
    descripcion: 'Mide temperatura y humedad del ambiente. Muy usado en estaciones meteorológicas escolares.',
    precio: 69, stock: 28, imagen: 'img/sensor-dht.jpg', alt: 'Sensor de temperatura y humedad',
    variantes: [
      { nombre: 'Modelo', opciones: [{ valor: 'DHT11', extra: 0 }, { valor: 'DHT22', extra: 75 }] }
    ]
  },
  {
    id: 'kit-leds', categoria: 'prototipado', nombre: 'Kit de LEDs y resistencias',
    descripcion: 'LEDs de colores y resistencias de valores comunes para tus primeros circuitos.',
    precio: 85, stock: 33, imagen: 'img/kit-leds.jpg', alt: 'Kit de LEDs de colores y resistencias',
    variantes: [
      { nombre: 'Cantidad', opciones: [{ valor: '100 piezas', extra: 0 }, { valor: '300 piezas', extra: 95 }] }
    ]
  },
  {
    id: 'pinzas', categoria: 'herramientas', nombre: 'Pinzas de corte para electrónica',
    descripcion: 'Corte limpio de patas de componentes y cables delgados. Mango ergonómico.',
    precio: 95, stock: 12, imagen: 'img/pinzas.jpg', alt: 'Pinzas de corte para electrónica',
    variantes: [
      { nombre: 'Color del mango', opciones: [{ valor: 'Azul', extra: 0 }, { valor: 'Rojo', extra: 0 }] }
    ]
  }
];

// ---------- Búsqueda y Validación de Precios ----------

// Busca y devuelve un producto por su id dentro de la lista PRODUCTOS
function buscarProducto(id) {
  return PRODUCTOS.find((producto) => producto.id === id);
}

// Calcula el precio real sumando variantes directamente desde la lista oficial
function obtenerPrecioReal(id, varianteIdOTexto) {
  //Busca el producto en la lista PRODUCTOS
  const producto = buscarProducto(id);
  if (!producto) return 0;
  
  let precio = producto.precio; // Comienza con el precio base

  // Si hay variantes
  if (varianteIdOTexto && producto.variantes) {
    //Formato por índices
    if (varianteIdOTexto.includes(':')) { 
      const pares = varianteIdOTexto.split(','); // Separa los pares
      for (const par of pares) { // Recorre los pares
        const partes = par.split(':');
        const i = Number(partes[0]);
        const j = Number(partes[1]);
        if (producto.variantes[i] && producto.variantes[i].opciones[j]) {
          precio += producto.variantes[i].opciones[j].extra; // Suma el costo extra
        }
      }
    } else {
      // Formato por texto (mantiene compatibilidad con carritos guardados antes)
      const nombresOpciones = varianteIdOTexto.split(', ');
      for (const variante of producto.variantes) {
        for (const opcion of variante.opciones) {
          if (nombresOpciones.includes(opcion.valor)) {
            precio += opcion.extra; // Suma el costo extra
          }
        }
      }
    }
  }
  return precio;
}
