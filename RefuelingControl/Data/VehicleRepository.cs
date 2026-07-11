using System.Collections.Generic;
using System.Linq;
using RefuelingControl.Models;

namespace RefuelingControl.Data
{
    public class VehicleRepository
    {
        private List<Vehicle> _vehicles = new List<Vehicle>();
        private int _nextId = 1;

        public VehicleRepository()
        {
            // Datos de ejemplo con todos los campos
            _vehicles.Add(new Vehicle 
            { 
                Id = _nextId++, 
                VehicleType = "🚗 Coche",
                Name = "Sedán Familiar",
                LicensePlate = "1234ABC", 
                Brand = "Toyota", 
                Model = "Corolla", 
                Year = 2020, 
                FuelType = "Gasolina",
                Description = "Vehículo familiar, 5 puertas, color blanco" 
            });
            
            _vehicles.Add(new Vehicle 
            { 
                Id = _nextId++, 
                VehicleType = "🏍️ Motocicleta",
                Name = "Naked Deportiva",
                LicensePlate = "5678DEF", 
                Brand = "Ford", 
                Model = "Focus", 
                Year = 2019, 
                FuelType = "Diésel",
                Description = "Compacto diésel, bajo consumo" 
            });
            
            _vehicles.Add(new Vehicle 
            { 
                Id = _nextId++, 
                VehicleType = "🚗 Coche",
                Name = "Eléctrico Premium",
                LicensePlate = "9012GHI", 
                Brand = "Tesla", 
                Model = "Model 3", 
                Year = 2022, 
                FuelType = "Eléctrico",
                Description = "100% eléctrico, autonomía 500km" 
            });
            
            _vehicles.Add(new Vehicle 
            { 
                Id = _nextId++, 
                VehicleType = "🚐 Furgoneta",
                Name = "Furgón de Carga",
                LicensePlate = "3456JKL", 
                Brand = "Renault", 
                Model = "Clio", 
                Year = 2021, 
                FuelType = "Gasolina",
                Description = "Urbano compacto, 5 puertas" 
            });
            
            _vehicles.Add(new Vehicle 
            { 
                Id = _nextId++, 
                VehicleType = "🚛 Camión",
                Name = "Camión Articulado",
                LicensePlate = "7890MNO", 
                Brand = "Seat", 
                Model = "Leon", 
                Year = 2018, 
                FuelType = "Diésel",
                Description = "Deportivo compacto, 150CV" 
            });
        }

        public List<Vehicle> GetAll()
        {
            return _vehicles;
        }

        public Vehicle GetById(int id)
        {
            return _vehicles.FirstOrDefault(v => v.Id == id);
        }

        public void Add(Vehicle vehicle)
        {
            vehicle.Id = _nextId++;
            _vehicles.Add(vehicle);
        }

        public bool Delete(int id)
        {
            var vehicle = GetById(id);
            if (vehicle != null)
            {
                _vehicles.Remove(vehicle);
                return true;
            }
            return false;
        }
    }
}