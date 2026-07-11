using System;
using System.Collections.Generic;
using System.Linq;
using RefuelingControl.Models;
using RefuelingControl.Data;

namespace RefuelingControl.Services
{
    public class RepostajeConConsumo
    {
        public Repostaje Repostaje { get; set; }
        public double? ConsumoMedio100Km { get; set; }
        public bool EsMejorQueAnterior { get; set; }
    }

    public class RepostajeService
    {
        private RepostajeRepository _repository;

        public RepostajeService()
        {
            _repository = new RepostajeRepository();
        }

        public void AddRepostaje(Repostaje repostaje)
        {
            _repository.Add(repostaje);
        }

        public void DeleteAllForVehicle(int vehicleId)
        {
            _repository.DeleteByVehicleId(vehicleId);
        }

        // Historial ordenado con el consumo medio (L/100km) de cada repostaje,
        // calculado con los km recorridos desde el repostaje anterior.
        public List<RepostajeConConsumo> GetHistorialConConsumo(int vehicleId)
        {
            var repostajes = _repository.GetByVehicleId(vehicleId);
            var resultado = new List<RepostajeConConsumo>();
            double? consumoAnterior = null;

            for (int i = 0; i < repostajes.Count; i++)
            {
                var actual = repostajes[i];
                double? consumo = null;

                if (i > 0)
                {
                    int kmRecorridos = actual.KmActuales - repostajes[i - 1].KmActuales;
                    if (kmRecorridos > 0)
                    {
                        consumo = Math.Round((actual.Litros / kmRecorridos) * 100, 2);
                    }
                }

                bool esMejor = consumo == null || consumoAnterior == null || consumo <= consumoAnterior;

                resultado.Add(new RepostajeConConsumo
                {
                    Repostaje = actual,
                    ConsumoMedio100Km = consumo,
                    EsMejorQueAnterior = esMejor
                });

                if (consumo != null)
                {
                    consumoAnterior = consumo;
                }
            }

            return resultado;
        }

        public double? GetConsumoMedioTotal(int vehicleId)
        {
            var valores = GetHistorialConConsumo(vehicleId)
                .Where(h => h.ConsumoMedio100Km.HasValue)
                .Select(h => h.ConsumoMedio100Km.Value)
                .ToList();

            return valores.Any() ? Math.Round(valores.Average(), 2) : (double?)null;
        }

        public double? GetConsumoMedioMensual(int vehicleId)
        {
            var haceUnMes = DateTime.Now.AddDays(-30);

            var valores = GetHistorialConConsumo(vehicleId)
                .Where(h => h.ConsumoMedio100Km.HasValue && h.Repostaje.FechaHora >= haceUnMes)
                .Select(h => h.ConsumoMedio100Km.Value)
                .ToList();

            return valores.Any() ? Math.Round(valores.Average(), 2) : (double?)null;
        }
    }
}
