import { motion } from 'framer-motion';
import { HiCheckCircle } from 'react-icons/hi';

const About = () => (
  <div className="min-h-screen bg-salon-bg">
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">About Aisha's Salon</h1>
          <p className="text-gray-300 text-lg">Our story, mission, and values</p>
        </motion.div>
      </div>
    </div>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Founded in 2015 by Aisha Bello, Aisha's Salon began as a small beauty studio in Victoria Island, Lagos. With a passion for making every client feel beautiful and confident, Aisha built a team of talented stylists who share her vision.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Today, we serve hundreds of clients monthly, offering premium hair, beauty, spa, and wellness services in a luxurious, welcoming environment.
          </p>
          <ul className="space-y-2">
            {['500+ Happy Clients', '10+ Years Experience', 'Premium Products Only', 'Certified Professionals'].map(item => (
              <li key={item} className="flex items-center gap-2 text-gray-700">
                <HiCheckCircle className="w-5 h-5 text-gold-500 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="h-80 bg-gradient-to-br from-gold-100 to-gold-200 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <p className="font-serif text-2xl font-bold text-gold-700">Aisha's Salon</p>
            <p className="text-gold-600">Est. 2015</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: 'Our Mission', desc: 'To provide exceptional beauty services that enhance confidence and celebrate individuality.' },
          { title: 'Our Vision', desc: 'To be the most trusted and loved salon brand in West Africa.' },
          { title: 'Our Values', desc: 'Excellence, integrity, creativity, and genuine care for every client.' },
        ].map(({ title, desc }) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card text-center">
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default About;
