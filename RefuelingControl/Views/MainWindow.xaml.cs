using System;
using System.Windows;
using System.Windows.Controls;
using RefuelingControl.Models;
using RefuelingControl.Services;

namespace RefuelingControl.Views
{
    public partial class MainWindow : Window
    {
        private VehicleService _vehicleService;

        public MainWindow()
        {
            InitializeComponent();
            _vehicleService = new VehicleService();
            LoadVehicles();
            LoadVehicleSelector();
            ShowListView();
        }

        private void LoadVehicles()
        {
            VehiclesListView.ItemsSource = _vehicleService.GetAllVehicles();
        }

        private void LoadVehicleSelector()
        {
            cmbVehicleSelector.Items.Clear();
            cmbVehicleSelector.Items.Add(new ComboBoxItem { Content = "Selecciona tu vehículo", IsSelected = true });

            foreach (var vehicle in _vehicleService.GetAllVehicles())
            {
                cmbVehicleSelector.Items.Add(new ComboBoxItem
                {
                    Content = $"{vehicle.VehicleType} {vehicle.Name} - {vehicle.LicensePlate}",
                    Tag = vehicle
                });
            }
        }

        private Vehicle GetSelectedVehicleFromSelector()
        {
            var selectedItem = cmbVehicleSelector.SelectedItem as ComboBoxItem;
            return selectedItem?.Tag as Vehicle;
        }

        private void ShowListView()
        {
            ListViewContainer.Visibility = Visibility.Visible;
            CreateFormContainer.Visibility = Visibility.Collapsed;
        }

        private void ShowCreateForm()
        {
            ListViewContainer.Visibility = Visibility.Collapsed;
            CreateFormContainer.Visibility = Visibility.Visible;
            ClearForm();
            txtFormMessage.Visibility = Visibility.Collapsed;
        }

        private void ClearForm()
        {
            txtVehicleName.Text = "";
            txtLicensePlate.Text = "";
            txtBrand.Text = "";
            txtModel.Text = "";
            txtYear.Text = "";
            txtDescription.Text = "";
            cmbVehicleType.SelectedIndex = 0;
            cmbFuelType.SelectedIndex = 0;
        }

        private bool IsValidYear(string year)
        {
            if (int.TryParse(year, out int yearValue))
            {
                int currentYear = DateTime.Now.Year;
                return yearValue >= 1900 && yearValue <= currentYear + 1;
            }
            return false;
        }

        private void ShowMessage(string message, string color)
        {
            txtFormMessage.Text = message;
            txtFormMessage.Visibility = Visibility.Visible;
            
            if (color == "Red")
                txtFormMessage.Foreground = System.Windows.Media.Brushes.Red;
            else if (color == "Green")
                txtFormMessage.Foreground = System.Windows.Media.Brushes.Green;
        }

        // ==========================================
        // EVENTOS DEL SELECTOR DE VEHÍCULO / REPOSTAJES
        // ==========================================

        private void VehicleSelector_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var vehicle = GetSelectedVehicleFromSelector();

            if (vehicle == null)
            {
                txtSelectedVehicleInfo.Text = "Selecciona un vehículo para gestionar sus repostajes";
                btnNewRefuel.IsEnabled = false;
                btnListRefuels.IsEnabled = false;
                return;
            }

            txtSelectedVehicleInfo.Text = $"{vehicle.VehicleType} {vehicle.Name} - {vehicle.LicensePlate} ({vehicle.Brand} {vehicle.Model}, {vehicle.Year})";
            btnNewRefuel.IsEnabled = true;
            btnListRefuels.IsEnabled = true;
        }

        private void NewRefuel_Click(object sender, RoutedEventArgs e)
        {
            var vehicle = GetSelectedVehicleFromSelector();
            if (vehicle == null) return;

            MessageBox.Show($"🚧 'Nuevo repostaje' pendiente de implementar.\n\nVehículo: {vehicle.Name} ({vehicle.LicensePlate})",
                            "Próximamente", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void ListRefuels_Click(object sender, RoutedEventArgs e)
        {
            var vehicle = GetSelectedVehicleFromSelector();
            if (vehicle == null) return;

            MessageBox.Show($"🚧 'Listar repostajes' pendiente de implementar.\n\nVehículo: {vehicle.Name} ({vehicle.LicensePlate})",
                            "Próximamente", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        // ==========================================
        // EVENTOS DEL MENÚ
        // ==========================================

        private void MenuButton_Click(object sender, RoutedEventArgs e)
        {
            MenuPopup.IsOpen = !MenuPopup.IsOpen;
        }

        private void CreateVehicle_Click(object sender, RoutedEventArgs e)
        {
            MenuPopup.IsOpen = false;
            ShowCreateForm();
        }

        private void DeleteVehicle_Click(object sender, RoutedEventArgs e)
        {
            MenuPopup.IsOpen = false;
            
            if (VehiclesListView.SelectedItem == null)
            {
                MessageBox.Show("⚠️ Por favor, selecciona un vehículo de la lista para borrar.", 
                                "Atención", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var vehicle = (Vehicle)VehiclesListView.SelectedItem;
            var result = MessageBox.Show($"¿Seguro que quieres borrar el vehículo?\n\n" +
                                        $"Tipo: {vehicle.VehicleType}\n" +
                                        $"Nombre: {vehicle.Name}\n" +
                                        $"Matrícula: {vehicle.LicensePlate}\n" +
                                        $"Marca: {vehicle.Brand} {vehicle.Model}", 
                                        "Confirmar eliminación", 
                                        MessageBoxButton.YesNo, 
                                        MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                _vehicleService.DeleteVehicle(vehicle.Id);
                LoadVehicles();
                LoadVehicleSelector();
                ShowListView();
                MessageBox.Show("✅ Vehículo eliminado correctamente.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private void ViewAllVehicles_Click(object sender, RoutedEventArgs e)
        {
            MenuPopup.IsOpen = false;
            LoadVehicles();
            LoadVehicleSelector();
            ShowListView();
        }

        private void Exit_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("¿Seguro que quieres salir?", "Confirmar", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (result == MessageBoxResult.Yes)
            {
                Application.Current.Shutdown();
            }
        }

        // ==========================================
        // EVENTOS DEL FORMULARIO
        // ==========================================

        private void CancelCreate_Click(object sender, RoutedEventArgs e)
        {
            ShowListView();
        }

        private void SaveVehicle_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                // VALIDACIONES
                // 1. Nombre del vehículo (obligatorio)
                if (string.IsNullOrWhiteSpace(txtVehicleName.Text))
                {
                    ShowMessage("❌ El campo 'Nombre del Vehículo' es obligatorio.", "Red");
                    txtVehicleName.Focus();
                    return;
                }

                // 2. Matrícula (obligatoria)
                if (string.IsNullOrWhiteSpace(txtLicensePlate.Text))
                {
                    ShowMessage("❌ El campo 'Matrícula' es obligatorio.", "Red");
                    txtLicensePlate.Focus();
                    return;
                }

                // 3. Marca (obligatoria)
                if (string.IsNullOrWhiteSpace(txtBrand.Text))
                {
                    ShowMessage("❌ El campo 'Marca' es obligatorio.", "Red");
                    txtBrand.Focus();
                    return;
                }

                // 4. Modelo (obligatorio)
                if (string.IsNullOrWhiteSpace(txtModel.Text))
                {
                    ShowMessage("❌ El campo 'Modelo' es obligatorio.", "Red");
                    txtModel.Focus();
                    return;
                }

                // 5. Tipo de Vehículo (obligatorio)
                if (cmbVehicleType.SelectedIndex <= 0)
                {
                    ShowMessage("❌ Debes seleccionar un 'Tipo de Vehículo'.", "Red");
                    cmbVehicleType.Focus();
                    return;
                }

                // 6. Año (obligatorio y válido)
                if (string.IsNullOrWhiteSpace(txtYear.Text))
                {
                    ShowMessage("❌ El campo 'Año' es obligatorio.", "Red");
                    txtYear.Focus();
                    return;
                }

                if (!IsValidYear(txtYear.Text))
                {
                    ShowMessage($"❌ El año debe ser un número válido entre 1900 y {DateTime.Now.Year + 1}.", "Red");
                    txtYear.Focus();
                    txtYear.SelectAll();
                    return;
                }

                // 7. Tipo de combustible (obligatorio)
                if (cmbFuelType.SelectedIndex <= 0)
                {
                    ShowMessage("❌ Debes seleccionar un tipo de combustible.", "Red");
                    cmbFuelType.Focus();
                    return;
                }

                // CREAR EL VEHÍCULO
                var newVehicle = new Vehicle
                {
                    VehicleType = ((ComboBoxItem)cmbVehicleType.SelectedItem).Content.ToString(),
                    Name = txtVehicleName.Text.Trim(),
                    LicensePlate = txtLicensePlate.Text.Trim().ToUpper(),
                    Brand = txtBrand.Text.Trim(),
                    Model = txtModel.Text.Trim(),
                    Year = int.Parse(txtYear.Text),
                    FuelType = ((ComboBoxItem)cmbFuelType.SelectedItem).Content.ToString(),
                    Description = txtDescription.Text.Trim()
                };

                // Guardar en el repositorio
                _vehicleService.AddVehicle(newVehicle);

                // Mostrar mensaje de éxito
                ShowMessage("✅ ¡Vehículo creado con éxito!", "Green");

                // Recargar la lista y volver a la vista de lista
                LoadVehicles();
                LoadVehicleSelector();
                ShowListView();

                MessageBox.Show($"✅ Vehículo guardado correctamente.\n\n" +
                                $"Tipo: {newVehicle.VehicleType}\n" +
                                $"Nombre: {newVehicle.Name}\n" +
                                $"Matrícula: {newVehicle.LicensePlate}\n" +
                                $"Marca: {newVehicle.Brand} {newVehicle.Model}\n" +
                                $"Año: {newVehicle.Year}\n" +
                                $"Combustible: {newVehicle.FuelType}", 
                                "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                ShowMessage($"❌ Error al guardar: {ex.Message}", "Red");
            }
        }
    }
}