using System.Collections.Generic;
using System.Linq;
using RefuelingControl.Models;
using RefuelingControl.Data;

namespace RefuelingControl.Services
{
    public class VehicleService
    {
        private VehicleRepository _repository;
        
        public VehicleService()
        {
            _repository = new VehicleRepository();
        }
        
        public List<Vehicle> GetAllVehicles()
        {
            return _repository.GetAll();
        }
        
        public void AddVehicle(Vehicle vehicle)
        {
            _repository.Add(vehicle);
        }
        
        public bool DeleteVehicle(int id)
        {
            return _repository.Delete(id);
        }
        
        public Vehicle GetVehicleById(int id)
        {
            return _repository.GetById(id);
        }
    }
}