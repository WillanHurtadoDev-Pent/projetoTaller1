const express = require('express');
const router = express.Router();
const pool = require('../database');
const rxjs = require('rxjs');
const { json, Router } = require('express');
const multer = require('multer');
const bodyParser= require('body-parser');
const path = require('path');
const fs = require('fs');
const { isLoggedIn } = require('../lib/auth');
const { session } = require('passport');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');


const asyncForEach = async (array, callback) => {
   for (let i = 0; i < array.length; i++) {
     await callback(array[i], i, array);
   }
 };


//----------PAINEL---PRINCIPAL------------------------------------------------------------>
router.get('/',isLoggedIn, async (req,res)=>{
                 //console.log('no es la ruta');
         try
           {
           // console.log('no es el try');
            if (req.session.usuario && req.session.priv)
               {
                 // console.log('no es el if');
                  const usuario = req.session.usuario;
                  const privilegio = req.session.priv;
                  switch (privilegio){
                      
                        case 1 :
                        const personal = await pool.query('select *  from usuario');
                        res.render('dashboard/administrador/personal/listar',{personal});
                        break;
                     
                        case 2 : 
                        const miInformacion = await pool.query('select * from usuario where idUsuario = ?',[usuario]);
                        res.render('dashboard/encargado/miInformacion',{miInformacion});
                        break;

                        case 3 : 
                        const miInformacionEmp = await pool.query('select * from usuario where idUsuario = ?',[usuario]);
                        res.render('dashboard/empleado/miInformacion',{miInformacionEmp});
                        break;
                  }
                  //console.log(personal);
               }
            else
            { 
               req.flash('message','ups, algo salió mal, intentalo de nuevo');
               res.redirect('back');
            }
           }
           catch(err){
              console.log(err);
           }
      
      

});
//----LISTAR----PERSONAL----ADMIN-------------------------------------------------------------------->
router.get('/personal',isLoggedIn, async (req,res)=>{
   if(req.session.priv ){
       const priv = req.session.priv;
       if (Number(priv) === 1)
       {
         try
         {
           const personal = await pool.query('select * from usuario');
           res.render('dashboard/administrador/personal/listar',{personal});
         }
         catch(err)
         {
           req.flash('message',err); 
           res.redirect('back');
         }
       }
       else
       {
          req.flash('message','privilegios insuficientes, porfavor no dañinear');
          res.redirect('back');
       }
   }
   else
   {
      req.flash('message','privilegios insuficientes, porfavor no dañinear');
      res.redirect('back');
   }
});
//---ELIMINAR---PERSONAL------ADMIN-------------------------------------------------------->
router.get('/eliminarPers/:idUsuario',isLoggedIn, async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const {idUsuario} = req.params;
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        await pool.query('delete from usuario where idUsuario = ?',[idUsuario]);
        req.flash('message',' usuario eliminado correctamente');
        res.redirect('back');
      }

      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
});
//---EDITAR----PERSONAL----ADMIN--------------------------------------------------------->
router.get('/editarInfoPers/:idUsuario',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const {idUsuario} = req.params;
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const infoPers = await pool.query('select * from  usuario where idUsuario = ?',[idUsuario]);
        res.render('dashboard/administrador/personal/editar',{infoPers})
      }

      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }

});
//--post---editar---personal-------->
router.post('/editarInfoPers',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const {idUsuario} = req.body;
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const {idUsuario,username,email,telefono,password,idPrivilegio}=req.body;
        const nuevaInfoUsuario = {
          username,
          email,
          telefono,
          password,
          idPrivilegio
        };
        console.log(nuevaInfoUsuario);
        await pool.query('update usuario set ? where idUsuario = ?',[nuevaInfoUsuario,idUsuario]);
        const personal = await pool.query('select * from usuario');
        res.render('dashboard/administrador/personal/listar',{personal});
      }

      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }


  });
//--ADICIONAR------PERSONAL--------------ADMIN---------------------------------------------->
router.get('/adicionarPers',isLoggedIn,async(req,res)=>{
   
  if(req.session.priv || req.session.usuario ){
    const {idUsuario} = req.params;
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        res.render('dashboard/administrador/personal/adicionar');
      }

      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }

});
//post---adicionar---personal---admin------------->
router.post('/adicionarPers',isLoggedIn,async(req,res)=>{
  const {username,email,telefono,password,privilegio}=req.body;
  const nuevoUsuario = {
    username,
    email,
    telefono,
    password,
    privilegio
  };
  await pool.query('insert into usuario(username,email,telefono,password,privilegio) set ?',[nuevoUsuario]);
  res.render('/dashboard');
});

//---LISTAR---PROYECTOS--------------------------------------------------------------------->
router.get('/proyectos',isLoggedIn,async(req,res)=>{
   if(req.session.priv && req.session.usuario ){
      const usuario = req.session.usuario;
      const priv = req.session.priv; 
      
      switch(priv)
      {


        case 1 :
         try
         {
           const proyectos = await pool.query('select * from proyecto');
           res.render('dashboard/administrador/proyectos/listar',{proyectos});
         }
         catch(err)
         {
           req.flash('message',err); 
           res.redirect('back');
         }
         break;

         case 2:
            try
        {
          const proyectosEnc = await pool.query('select idEquipo from grupo where idUsuario = ?',[usuario]);
          console.log(proyectosEnc);
          await asyncForEach(proyectosEnc, async (sect) => {
            sect.proyecto = await pool.query(` select * from equipo inner join proyecto on proyecto.idProyecto = equipo.idProyecto where equipo.idEquipo  =  ${sect.idEquipo}`);
            
          });
          res.render('dashboard/encargado/proyectos',{proyectosEnc});
        }
        catch(err)
        {
          req.flash('message',err); 
          res.redirect('back');
        }
        break;

        case 3:
        try
         {
            req.flash('message','privilegios insuficientes, porfavor no dañinear');
            res.redirect('back');
         }
         catch(err)
         {
            req.flash('message',err); 
            res.redirect('back');
         }
         break;
      }
   }
   else
   {
     req.flash('message','privilegios insuficientes, porfavor no dañinear');
     res.redirect('back');
   }
});

//ADICIONAR----PROYECTOS------ADMIN--------------------------------------------------------------------->
router.get('/adicionarProyecto',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        res.render('dashboard/administrador/proyectos/adicionar');
      }
   
      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//adicionar---proyectos------post--------------------------->
router.post('/adicionarProyecto',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
   const priv = req.session.priv;
   if (Number(priv) === 1)
   {
     try
     {
      
         const { nombre,descripcion,fecha_inicio,fecha_fin,estado } = req.body;
         nuevProy = { 
           nombre,
           descripcion,
           fecha_inicio,
           fecha_fin,
           estado }
           await pool.query('insert into proyecto set ?',[nuevProy]);
           res.redirect('/dashboard/proyectos');
  
     }
  
     catch(err)
     {
       req.flash('message',err); 
       res.redirect('back');
     }
   }
   else
   {
      req.flash('message','privilegios insuficientes, porfavor no dañinear');
      res.redirect('back');
   }
  }
  else
  {
  req.flash('message','privilegios insuficientes, porfavor no dañinear');
  res.redirect('back');
  }
   
  });
//EDITAR--IFORMACION-----PROYECTO---------------------------------------------->
router.get('/editarInfoProyec/:idProyecto',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const {idProyecto} = req.params;
        const infProy = await pool.query('select * from proyecto where idProyecto = ?',[idProyecto]);
        res.render('dashboard/administrador/proyectos/editar',{infProy});
      }
   
      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//editar---info---proyec---post
router.post('/editarInfoProyec',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
   const priv = req.session.priv;
   if (Number(priv) === 1)
   {
     try
     {
      
         const {idProyecto,nombre,descripcion,fecha_inicio,fecha_fin,estado } = req.body;
         nuevProy = { 
           nombre,
           descripcion,
           fecha_inicio,
           fecha_fin,
           estado }
           await pool.query('update proyecto set ? where idProyecto = ?',[nuevProy,idProyecto]);
           res.redirect('/dashboard/proyectos');
     }
  
     catch(err)
     {
       req.flash('message',err); 
       res.redirect('back');
     }
   }
   else
   {
      req.flash('message','privilegios insuficientes, porfavor no dañinear');
      res.redirect('back');
   }
  }
  else
  {
  req.flash('message','privilegios insuficientes, porfavor no dañinear');
  res.redirect('back');
  }
   
  });

//eliminar----proyecto-----admin-------------------------->
router.get('/eliminarProyecto/:idProyecto',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
            const {idProyecto} = req.params;
            console.log(idProyecto);
            await pool.query('delete from proyecto where idProyecto = ?',[idProyecto]);
            res.redirect('/dashboard/proyectos');
   
      }
   
      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});

//---LISTAR---SUBPROYECTOS------------------------------------------------------------------------------->
router.get('/subProyectos',isLoggedIn,async(req,res)=>{
   if(req.session.priv && req.session.usuario ){
      const priv = req.session.priv;
      const usuario = req.session.usuario; 
      switch(priv)
      {


        case 1 :
         try
         {
           const infoSubPro = await pool.query('select * from subproyecto');
           console.log(infoSubPro);
           res.render('dashboard/administrador/subproyectos/listar',{infoSubPro});
         }
         catch(err)
         {
           req.flash('message',err); 
           console.log(err);
           res.redirect('back');
         }
         break;

         case 2:
            try
        {
          const subProyectoEnc = await pool.query('select idEquipo from grupo where idUsuario = ?',[usuario]);
          console.log(subProyectoEnc);
          await asyncForEach(subProyectoEnc, async (sect) => {
            sect.subProyecto = await pool.query(` select * from equipo inner join subproyecto on subproyecto.idSubPro = equipo.idSubPro where equipo.idEquipo  =  ${sect.idEquipo}`);
          });
         res.render('dashboard/encargado/subProyectos',{subProyectoEnc});
        }
        catch(err)
        {
          req.flash('message',err); 
          res.redirect('back');
        }
        break;

        case 3:
        try
         {
            const subProyectoEmp = await pool.query('SELECT * FROM equipo inner join grupo on equipo.idGrupo = grupo.idGrupo inner join subproyecto on subproyecto.idSubPro = equipo.idSubPro where grupo.idUsuario = ?',[usuario]);
  
            res.render('dashboard/empleado/subPoyectos',{subProyectoEmp});
         }
         catch(err)
         {
            req.flash('message',err); 
            res.redirect('back');
         }
         break;
      }
   }
   else
   {
     req.flash('message','privilegios insuficientes, porfavor no dañinear');
     res.redirect('back');
   }
})

//ADICIONAR----subPROYECTOS------ADMIN--------------------------------------------------------------------->
router.get('/adicionarSubProyecto',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        res.render('dashboard/administrador/subproyectos/adicionar');
      }
   
      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//adicionar----subproyectos--------post
router.post('/adicionarSubProyecto',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
       
          const { nombre,descripcion,fecha_inicio,fecha_fin,estado } = req.body;
          nuevProy = { 
            nombre,
            descripcion,
            fecha_inicio,
            fecha_fin,
            estado }
            await pool.query('insert into subproyecto set ? ',[nuevProy]);
            res.redirect('/dashboard/subproyectos');
      }
   
      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
    
});
//EDITAR--IFORMACION-----subPROYECTO---------------------------------------------->
router.get('/editarInfoSubProyec/:idSubPro',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const {idSubPro} = req.params;
        const infProy = await pool.query('select * from subproyecto where idSubPro = ?',[idSubPro]);
        res.render('dashboard/administrador/subproyectos/editar',{infProy});
      }
   
      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//editar---info---subproyec---post
router.post('/editarInfoSubProyec',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
   const priv = req.session.priv;
   if (Number(priv) === 1)
   {
     try
     {
      
         const { idSubPro,nombre,descripcion,fecha_inicio,fecha_fin,estado } = req.body;
         nuevProy = { 
           nombre,
           descripcion,
           fecha_inicio,
           fecha_fin,
           estado }
           await pool.query('update subproyecto set ? where idSubPro = ?',[nuevProy,idSubPro]);
          res.redirect('/dashboard/subproyectos');
  
     }
  
     catch(err)
     {
       req.flash('message',err); 
       res.redirect('back');
     }
   }
   else
   {
      req.flash('message','privilegios insuficientes, porfavor no dañinear');
      res.redirect('back');
   }
  }
  else
  {
  req.flash('message','privilegios insuficientes, porfavor no dañinear');
  res.redirect('back');
  }
   
  });

//eliminar----subproyecto-----admin-------------------------->
router.get('/eliminarSubProyecto/:idSubPro',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
            const {idSubPro} = req.params;
            console.log(idSubPro);
            await pool.query('delete from subproyecto where idSubPro = ?',[idSubPro]);
            res.redirect('/dashboard/subproyectos');
   
      }
   
      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});


//---LISTAR-----EQUIPOS----------------------------------------------------------------------->
router.get('/grupos',isLoggedIn,async(req,res)=>{
   if(req.session.priv && req.session.usuario ){
      const usuario = req.session.usuario;
      const priv = req.session.priv; 
      
      switch(priv)
      {


        case 1 :
         try
         {
          
           const infoEquipos = await pool.query('select * from equipo');
           console.log(infoEquipos);
           await asyncForEach(infoEquipos, async (sect) => {
            sect.grupos = await pool.query(` select  * from grupo inner join usuario on usuario.idUsuario = grupo.idUsuario where grupo.idEquipo =  ${sect.idEquipo}`);
            console.log(infoEquipos);
          });
           res.render('dashboard/administrador/equipos/listar',{infoEquipos});
         }
         catch(err)
         {
           req.flash('message',err); 
           res.redirect('back');
         }
         break;

         case 2:
            try
        {
          const infoEquiposEnc = await pool.query('SELECT idEquipo from grupo where idUsuario = ?',[usuario]);
           await asyncForEach(infoEquiposEnc, async (sect) => {
            sect.grupos = await pool.query(` select * from grupo inner join usuario on usuario.idUsuario = grupo.idUsuario where grupo.idEquipo = ${sect.idEquipo}`);
          
          });
          res.render('dashboard/encargado/equipos',{infoEquiposEnc});
         }
        catch(err)
        {
          req.flash('message',err); 
          res.redirect('back');
        }
        break;

        case 3:
        try
         {
            req.flash('message','privilegios insuficientes, porfavor no dañinear');
            res.redirect('back');
         }
         catch(err)
         {
            req.flash('message',err); 
            res.redirect('back');
         }
         break;
      }
   }
   else
   {
     req.flash('message','privilegios insuficientes, porfavor no dañinear');
     res.redirect('back');
   }
});
//ADICIONAR------EQUIPOS-----ADMIN-------------------------------------------------------------------->
router.get('/adicionarEquipo',isLoggedIn,async(req,res)=>{
   
    if(req.session.priv || req.session.usuario ){
      const {idUsuario} = req.params;
      const priv = req.session.priv;
      if (Number(priv) === 1)
      {
        try
        {
          res.render('dashboard/administrador/equipos/adicionar');
        }
  
        catch(err)
        {
          req.flash('message',err); 
          res.redirect('back');
        }
      }
      else
      {
         req.flash('message','privilegios insuficientes, porfavor no dañinear');
         res.redirect('back');
      }
    }
    else
    {
     req.flash('message','privilegios insuficientes, porfavor no dañinear');
     res.redirect('back');
    }
   
});
//post---adicionar---equipo---proyecto-------------------------------->
router.post('/adicionarGrupo',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const { idProyecto,idSubPro,idSubFases } = req.body;
         if(idProyecto){
          const nuevEquipo = {
            idProyecto
          };
          await pool.query('insert into equipo  set ?',[nuevEquipo]);
          res.redirect('/dashboard/grupos');
         }else if(idSubPro){ 
          const nuevEquipo = {
            idSubPro
          };
          await pool.query('insert into equipo  set ?',[nuevEquipo]);
          res.redirect('/dashboard/grupos');
          } else if(idSubFases){
          const nuevEquipo = {
            idSubFases
          };
          await pool.query('insert into equipo  set ?',[nuevEquipo]);
          res.redirect('/dashboard/grupos');
        }
        
       
      }

      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
 
});
//EDITAR----INFORMACION----EQUIPO-----ADMIN--------------------------------------------------->
router.get('/editarInfoEqui/:idEquipo',isLoggedIn,async(req,res)=>{
   
  if(req.session.priv || req.session.usuario ){
    const {idEquipo} = req.params;
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        infoEquipos = await pool.query('select * from equipo where idEquipo = ?',[idEquipo]);
        res.render('dashboard/administrador/equipos/editar',{infoEquipos});
      }

      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
 
});
//editar--------informacion-------equipo -------post-------------->
router.post('/editarInfoEqui/:idEquipo',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        
        const { idProyecto,idSubPro,idSubFases } = req.body;
         if(idProyecto){
          const nuevEquipo = {
            idProyecto
          };
          const {idEquipo} = req.params;
          await pool.query('update  equipo  set ? where idEquipo = ?',[nuevEquipo,idEquipo]);
          res.redirect('/dashboard/grupos');
         }else if(idSubPro){ 
          const nuevEquipo = {
            idSubPro
          };
          const {idEquipo} = req.params;
          await pool.query('update  equipo  set ? where idEquipo = ?',[nuevEquipo,idEquipo]);
          res.redirect('/dashboard/grupos');
          } else if(idSubFases){
          const nuevEquipo = {
            idSubFases
          };
          const {idEquipo} = req.params;
          console.log(idEquipo);
          await pool.query('update  equipo  set ? where idEquipo = ?',[nuevEquipo,idEquipo]);
          res.redirect('/dashboard/grupos');
        }
        
       
      }

      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
 
});

//eliminar---equipo-------------------------->
router.get('/eliminarEquipo/:idEquipo',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const {idEquipo} = req.params;
        const idEqui = idEquipo;
        await pool.query('delete from equipo where idEquipo = ?',[idEqui]);
        res.redirect('/dashboard/grupos');
      }
      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
});

//ADICIONAR--PERSONAS---AL-----EQUIPO-----ADMIN-------------------------------------------------------------------->
router.get('/adicionarPersEqui/:idEquipo',isLoggedIn,async(req,res)=>{
   
  if(req.session.priv || req.session.usuario ){
    const {idEquipo} = req.params;
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const nuevIntegrante = await pool.query('select idEquipo from equipo where idEquipo = ?',[idEquipo]);
        res.render('dashboard/administrador/equipos/adicionarPersEqui',{nuevIntegrante});
      }

      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
 
});
//post---adicionar---pers-----equipo----------------------------------->
router.post('/adicionarPersEqui',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const { idUsuario,idEquipo } = req.body;

        const nuevGrupo = {
          idUsuario,
          idEquipo 
        };
        await pool.query('insert into grupo  set ?',[nuevGrupo]);
        res.redirect('/dashboard/grupos')
      }

      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
 
});
//eliminar---persona---do---equipo--------------------------->
router.get('/eliminarPersEqui/:idUsuario',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const {idUsuario}= req.params;
        const id = idUsuario;
        await pool.query('delete from grupo where idUsuario = ?',[id]);
        req.flash('message','eliminado correctamente');
        res.redirect('/dashboard/grupos')
      }

      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
 
});


//---LISTAR---subfases------------------------------------------------------------------------------->
router.get('/subFases',isLoggedIn,async(req,res)=>{
  if(req.session.priv && req.session.usuario ){
     const priv = req.session.priv;
     
     switch(priv)
     {


       case 1 :
        try
        {
          const infoSubFas = await pool.query('select * from subfases');
          res.render('dashboard/administrador/subfases/listar',{infoSubFas});
        }
        catch(err)
        {
          req.flash('message',err); 
          console.log(err);
          res.redirect('back');
        }
        break;

        case 2:
           try
       {
         const usuario = req.session.usuario; 
         const subFasesEnc = await pool.query('select idEquipo from grupo where idUsuario = ?',[usuario]);
         console.log(subFasesEnc);
         await asyncForEach(subFasesEnc, async (sect) => {
           sect.subFase = await pool.query(` select * from equipo inner join subfases on subfases.idSubfases = equipo.idSubFases where equipo.idEquipo  =  ${sect.idEquipo}`);
         });
        res.render('dashboard/encargado/subFases',{subFasesEnc});
       }
       catch(err)
       {
         req.flash('message',err); 
         res.redirect('back');
       }
       break;

       case 3:
       try
        {
          const usuario = req.session.usuario; 
           const subFasesEmp = await pool.query('SELECT * FROM equipo inner join grupo on equipo.idEquipo = grupo.idEquipo inner join subfases on subfases.idSubFases = equipo.idSubFases where grupo.idUsuario = ?',[usuario]);
 
           res.render('dashboard/empleado/misTareas',{subFasesEmp});
        }
        catch(err)
        {
          console.log(err);
           req.flash('message',err); 
           res.redirect('back');
        }
        break;
     }
  }
  else
  {
    req.flash('message','privilegios insuficientes, porfavor no dañinear');
    res.redirect('back');
  }
});


//ADICIONAR----SUBFASES-----ADMIN------------------------------------------------------------------------>
router.get('/adicionarSubFas',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        res.render('dashboard/administrador/subfases/adicionar');

      }

      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
  }
  else
  {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
  }
});
//adicionar---subfases------post--------------------------->
router.post('/adicionarSubFase',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
   const priv = req.session.priv;
   if (Number(priv) === 1)
   {
     try
     {
      
         const { nombre,descripcion,fechaInicio,fechaFin,estado } = req.body;
         nuevProy = { 
           nombre,
           descripcion,
           fechaInicio,
           fechaFin,
           estado }
           await pool.query('insert into subfases set ?',[nuevProy]);
           res.redirect('/dashboard/subFases')
  
     }
     catch(err)
     {
       console.log(err);
       req.flash('message',err); 
       res.redirect('back');
     }
   }
   else
   {
      req.flash('message','privilegios insuficientes, porfavor no dañinear');
      res.redirect('back');
   }
  }
  else
  {
  req.flash('message','privilegios insuficientes, porfavor no dañinear');
  res.redirect('back');
  }
   
  });
  
//eliminar----subfases-----admin-------------------------->
router.get('/eliminarSubFas/:idSubFases',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
            const {idSubFases} = req.params;
            await pool.query('delete from subfases where idSubFases = ?',[idSubFases]);
            res.redirect('/dashboard/subFases');
   
      }
   
      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//EDITAR-----------------------------INFO---------------SUBFASES----------------------->
router.get('/editarInfoSubFases/:idSubFases',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 1)
    {
      try
      {
        const {idSubFases} = req.params;
        console.log(idSubFases);
        const infProy = await pool.query('select * from subfases where idSubFases = ?',[idSubFases]);
        console.log(infProy);
        res.render('dashboard/administrador/subfases/editar',{infProy});
      }
   
      catch(err)
      {
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//editar---info---subfas---post
router.post('/editarInfoSubFases',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
   const priv = req.session.priv;
   if (Number(priv) === 1)
   {
     try
     {
      
         const { idSubFases,nombre,descripcion,fechaInicio,fechaFin,estado } = req.body;
         nuevProy = { 
           nombre,
           descripcion,
           fechaInicio,
           fechaFin,
           estado }
           await pool.query('update subfases set ? where idSubFases = ?',[nuevProy,idSubFases]);
          res.redirect('/dashboard/subfases');
  
     }
  
     catch(err)
     {
       console.log(err);
       req.flash('message',err); 
       res.redirect('back');
     }
   }
   else
   {
      req.flash('message','privilegios insuficientes, porfavor no dañinear');
      res.redirect('back');
   }
  }
  else
  {
  req.flash('message','privilegios insuficientes, porfavor no dañinear');
  res.redirect('back');
  }
   
  });
//CONFIRMAR--------------PROYECTO-----------------ENCA---------------------------------------->
router.get('/confirmarPro/:idProyecto',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 2)
    {
      try
      {
        const {idProyecto}= req.params;
        const estado = {
          estado:'confirmado',
      };
        await pool.query('update  proyecto set ? where idProyecto = ?',[estado,idProyecto]);
        req.flash('message','proyecto confirmado con exito ');
        res.redirect('back')
      }
   
      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//CONFIRMAR-------------SUB-PROYECTO-----------------ENCA---------------------------------------->
router.get('/confirmarSubPro/:idSubPro',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 2)
    {
      try
      {
        const {idSubPro}= req.params;
        const estado = {
          estado:'confirmado',
      };
        await pool.query('update  subproyecto set ? where idSubPro = ?',[estado,idSubPro]);
        req.flash('message','subproyecto confirmado con exito ');
        res.redirect('back')
      }
   
      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});
//CONFIRMAR-------------SUB-FASE-----------------EMPLE---------------------------------------->
router.get('/confirmarSubFase/:idSubFases',isLoggedIn,async(req,res)=>{
  if(req.session.priv || req.session.usuario ){
    const priv = req.session.priv;
    if (Number(priv) === 3)
    {
      try
      {
        const {idSubFases}= req.params;
        const estado = {
          estado:'confirmado',
      };
        await pool.query('update  subfases set ? where idSubFases = ?',[estado,idSubFases]);
        req.flash('message','subfases confirmado con exito ');
        res.redirect('back')
      }
   
      catch(err)
      {
        console.log(err);
        req.flash('message',err); 
        res.redirect('back');
      }
    }
    else
    {
       req.flash('message','privilegios insuficientes, porfavor no dañinear');
       res.redirect('back');
    }
   }
   else
   {
   req.flash('message','privilegios insuficientes, porfavor no dañinear');
   res.redirect('back');
   }
});


//--req.flash('message','se adicionó la sección con exito!')->











//---SEND------EMAIL-------CONFIGURAR----CON---DOMINIO----REAL



router.post('/send-email', async (req, res) => {
  const { name, email, phone, message } = req.body;

  contentHTML = `
      <h1>User Information</h1>
      <ul>
          <li>Username: ${name}</li>
          <li>User Email: ${email}</li>
          <li>PhoneNumber: ${phone}</li>
      </ul>
      <p>${message}</p>
  `;

  let transporter = nodemailer.createTransport({
      host: 'mail.fsocietybr.com',
      port: 587,
      secure: false,
      auth: {
          user: 'testarEmail@fsocietybr.com',
          pass: 'testarEmailSenha'
      },
      tls: {
          rejectUnauthorized: false
      }
  });

  let info = await transporter.sendMail({
      from: '"Fsocetybr server " <testarEmail@fsocietybr.xyz>', // sender address,
      to: 'fsocietybr@gmail.com',
      subject: 'Website Contact Form',
      // text: 'Hello World'
      html: contentHTML
  })

  console.log('Message sent: %s', info.messageId);
  

  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

  res.redirect('/success.html');
});




module.exports= router;
