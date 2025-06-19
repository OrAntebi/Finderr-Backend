import configProd from './prod.js'
import configDev from './dev.js'


export var config
if (process.env.NODE_ENV === 'production') {
    config = configProd
} else {
    config = configDev
}


//* Uncomment the following line to use the production configuration (Mongo Atlas DB)
// config = configProd
