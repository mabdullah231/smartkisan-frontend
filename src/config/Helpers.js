import { Notyf } from "notyf";
import axios from "axios";
import "notyf/notyf.min.css";

class Helpers {
  static localhost = "127.0.0.1:8000";
  static server = "";
  static basePath = `http://${this.localhost}`;
  static apiUrl = `${this.basePath}/api/`;
  static googleUrl = `${this.basePath}/`;
  static ASSETS_IMAGES_PATH = "/assets/img";
  static DASHBOARD_IMAGES_PATH = "/dashboard/images";

  static getAuthUser() {
    return JSON.parse(localStorage.getItem("user")) || {};
  }
  static serverFile = (name) => {
    return `${this.basePath}/${name}`;
  };

  static refresh() {
    this.authUser = JSON.parse(localStorage.getItem("user")) ?? {};
  }

  static authHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  static authFileHeaders = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  static getAuthHeaders() {
    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    };
  }
  static getHeaders() {
    return {
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  static getAuthFileHeaders() {
    return {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    };
  }

  static getItem = (data, isJson = false) => {
    const item = localStorage.getItem(data);
    if (!item) return null;
    if (isJson) {
      try {
        return JSON.parse(item);
      } catch (e) {
        return null;
      }
    } else {
      return item;
    }
  };

//   static scrollToTop(smooth = true) {
//     window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
//   }

  static removeItem = (name) => {
    localStorage.removeItem(name);
  };

  static setItem = (key, data, isJson = false) => {
    if (isJson) {
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      localStorage.setItem(key, data);
    }
  };

  static scrollToTop(smooth = true) {
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  }

//   // Format status nicely for UI
//   static formatWords = (status) => {
//     if (!status) return "";

//     return status
//       .split("_") // split words on "_"
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // capitalize each word
//       .join(" "); // join with space
//   };

  static toast = (type, message) => {
    const notyf = new Notyf();
    notyf.open({
      message: message,
      type: type,
      position: { x: "right", y: "top" },
      ripple: true,
      dismissible: true,
      duration: 2000,
    });
  };

}

export default Helpers;
