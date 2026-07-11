using System.Collections.Generic;
using System.Linq;
using RefuelingControl.Models;

namespace RefuelingControl.Data
{
    public class RepostajeRepository
    {
        private List<Repostaje> _repostajes = new List<Repostaje>();
        private int _nextId = 1;

        public List<Repostaje> GetByVehicleId(int vehicleId)
        {
            return _repostajes
                .Where(r => r.VehicleId == vehicleId)
                .OrderBy(r => r.FechaHora)
                .ToList();
        }

        public void Add(Repostaje repostaje)
        {
            repostaje.Id = _nextId++;
            _repostajes.Add(repostaje);
        }

        public void DeleteByVehicleId(int vehicleId)
        {
            _repostajes.RemoveAll(r => r.VehicleId == vehicleId);
        }
    }
}
