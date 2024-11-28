import passport from "passport";
import local from "passport-local";
import google from "passport-google-oauth20";
import jwt from "passport-jwt";
import { userDao } from "../dao/mongo/user.dao.js";
import { createHash, isValidPassword } from "../utils/hashPassword.js";
import { cookieExtractor } from "../utils/cookieExtractor.js";
import { createToken } from "../utils/jwt.js";
import { cartDao } from "../dao/mongo/cart.dao.js";

const LocalStrategy = local.Strategy;
const GoogleStrategy = google.Strategy;
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;


export const initializePassport = () => {

  passport.use(
    "register",
    new LocalStrategy({ passReqToCallback: true, usernameField: "email" }, async (req, username, password, done) => {
    
      try {
        const { first_name, last_name, age, role } = req.body;
      
        const user = await userDao.getByEmail(username);

        
        if (user) return done(null, false, { message: "El usuario ya existe" }); 

        
        const cart = await cartDao.create();

        
        const newUser = {
          first_name,
          last_name,
          age,
          email: username,
          password: createHash(password), 
          role: role ? role : "user",
          cart: cart._id,
        };

        const userRegister = await userDao.create(newUser);

        return done(null, userRegister);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.use(
    "login",
    new LocalStrategy({ usernameField: "email" }, async (username, password, done) => {
      try {
        const user = await userDao.getByEmail(username);

       
        if (!user || !isValidPassword(password, user.password)) {
          return done(null, false, { message: "Email o contraseña no válido" });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    })
  );


  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userDao.getById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });



  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: "fds",
        clientSecret: "dfs",

        callbackURL: "http://localhost:8080/api/sessions/google",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          const { id, name, emails } = profile;

          const user = {
            first_name: name.givenName,
            last_name: name.familyName,
            email: emails[0].value,
          };

          const existingUser = await userDao.getByEmail(user.email);

        
          if (existingUser) {
            return cb(null, existingUser);
          }

         
          const newUser = await userDao.create(user);
          return cb(null, newUser);
        } catch (error) {
          return cb(error);
        }
      }
    )
  );

 

  passport.use(
    "jwt",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey: "ClaveSecreta",
      },
      async (jwk_payload, done) => {
        try {
          return done(null, jwk_payload);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
