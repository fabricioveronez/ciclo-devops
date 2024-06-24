terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.89.0"
    }
  }
}

provider "azurerm" {
  features {
    
  }
}

resource "azurerm_resource_group" "rg_video" {
  name     = "aula-rg"
  location = "East US 2"
}

resource "azurerm_kubernetes_cluster" "k8s_video" {
  name                = "aula-aks"
  location            = azurerm_resource_group.rg_video.location
  resource_group_name = azurerm_resource_group.rg_video.name
  dns_prefix          = "aulaaks"

  default_node_pool {
    name                        = "default"
    node_count                  = 3
    vm_size                     = "Standard_D2_v2"
    temporary_name_for_rotation = "tmppool01"
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "local_file" "kubeconfig" {
  filename = "${path.module}/kubeconfig.yaml"
  content  = azurerm_kubernetes_cluster.k8s_video.kube_config_raw
}
