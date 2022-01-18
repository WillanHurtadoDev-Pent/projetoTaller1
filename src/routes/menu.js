const express = require('express');
const router = express.Router();
const pool = require('../database');
const rxjs = require('rxjs');
const { json } = require('express');
const bodyParser= require('body-parser');
const session = require('express-session');
var cookieParser = require('cookie-parser');



const asyncForEach = async (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array);
  }
};

//----RENDERIZAR----MENU------BUSH------------------------------------------------>
router.get('/bush', async (req, res) => {
  req.session.dir= 2;
  let secciones = await pool.query('select * from secciones where id_direc= 2');

  await asyncForEach(secciones, async (sect) => {
    sect.productos = await pool.query(`select * from productos where id_sec = ${sect.id_sec}`);
  });
  console.log(req.session.dir);
  res.render('menus/menu', { secciones });
});

//---RENDERIZAR----MENU-------ALEMANA---------------------------------------------->

router.get('/alemana', async (req, res) => {
  req.session.dir= 1;
  let secciones = await pool.query('select * from secciones where id_direc= 1');

  await asyncForEach(secciones, async (sect) => {
    sect.productos = await pool.query(`select * from productos where id_sec = ${sect.id_sec}`);
  });

 
  console.log(req.session.dir);

  res.render('menus/menu', { secciones });
});
//-----------CARRITO---Y--SUS--WEAS-------------------------------------------->

//------adicionar---al--carrito------------------------->
router.post('/add-carrito/:id_produ',async(req,res)=>{
  const {id_produ}= req.params;
  const {id_adi}=req.body;
  await pool.query
  const {nombre,precio,descripcion,cantidad}=req.body;
  const id_session = req.session.id;
  const puto= {
    id_produ,
    id_session,
    nombre,
    precio,
    descripcion,
    cantidad,
      }
   await pool.query('insert into pedidos  set ?',[puto]);
  req.flash('message','el producto fue adicionado al carrito exitosamente !');
  res.redirect('back')
});

//----renderizar------carrito--------------->

router.get('/comprando', async (req,res)=>{
  const esta= req.session.id;
  const carr= await pool.query(' select distinct nombre,precio,descripcion,id_produ,cantidad,opcion, id_pedidos from  pedidos where cantidad >0 and id_session= ? ',[esta]);
  await asyncForEach(carr, async (sect) => {
    sect.adicionales = await pool.query(`select * from adicionales where id_produ = ${sect.id_produ}`);
  });
 
  res.render('menus/comprando',{carr});
});

//----aumentar---la---cantidad--del--produ--->

router.get('/aumentar/:id_pedidos', async (req,res)=>{
    const {id_pedidos}=req.params;
    await pool.query('update pedidos set cantidad = cantidad +1 where id_pedidos = ?',[id_pedidos]);
    
   res.redirect('/menu/comprando');
});

//---eliminar--un---producto------------------------>

router.get('/quitar/:id_pedidos', async (req,res)=>{
  const {id_pedidos}=req.params;
  await pool.query('update pedidos set cantidad = cantidad -1 where id_pedidos = ?',[id_pedidos]);
 
   res.redirect('/menu/comprando');
});

//---------CONFIRMAR---------PEDIDOS------------------------------------->

router.post('/pedir', async (req,res)=>{
  const id_session= req.session.id;
  const {nombreadic}=req.body;
  const {id_pedidos}=req.body;
  req.session.id_pedidos= id_pedidos;
   req.session.adi= nombreadic ; 
  const {nombrecli,telefono,tipoDePago,tipoDeEnvio}=req.body;
  const confirmarPedido = {
    nombrecli,
    telefono,
    tipoDePago,
    tipoDeEnvio,
    id_session,
    
  }
  await pool.query('insert into confirmados set ?',[confirmarPedido]);
  console.log(req.session.adi);
  console.log(req.session.id_pedidos);
  res.render('menus/gracias');
});

//--adicionar---pedidos---a--la--db------------>
//mostrar--adicionales---a--pedidos---------->
router.get('/mostrarAdi/:id_produ', async (req,res)=>{
  const{id_produ}= req.params;
  req.session.pro= id_produ;
 const pu= await pool.query('select * from adicionales where id_produ = ?',[id_produ]);
  res.render('menus/mostrarAdi',{pu});
});
//adicionar----adicionales--------------------->
router.post('/adiAdi', async (req,res)=>{
const {opcion}=req.body;
const pel=req.session.pro;

await pool.query('UPDATE pedidos  set opcion = ? where id_produ= ?',[opcion,pel]);
req.flash('message','opcion guardada');
res.redirect('/menu/comprando');
});



router.get('/back', (req,res)=>{
   res.redirect('back');
});

module.exports = router;
