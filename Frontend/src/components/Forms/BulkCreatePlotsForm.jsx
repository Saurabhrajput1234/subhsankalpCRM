import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Download, Upload } from "lucide-react";
import { plotsAPI } from "../../utils/api";
import LoadingSpinner from "../UI/LoadingSpinner";
import toast from "react-hot-toast";
import { parseCSVToPlotData, validatePlotData } from "../../utils/csvUtils";

const BulkCreatePlotsForm = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [plotsData, setPlotsData] = useState([]);
  const [currentPlot, setCurrentPlot] = useState({
    plotNumber: "",
    block: "",
    registeredCompany: "",
    length: "",
    width: "",
    plotSize: "",
    basicRate: "",
    road: "",
    facing: "",
    gataKhesraNo: "",
    plcApplicable: false,
    typeofPLC: "",
    availablePlot: true,
    description: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      siteName: "Golden City Township",
    },
  });

  const siteName = watch("siteName");

  const updatePlotData = (index, field, value) => {
    const updatedPlots = [...plotsData];
    updatedPlots[index][field] = value;
    setPlotsData(updatedPlots);
  };

  const bulkUpdatePlotSize = () => {
    if (!currentPlot.plotSize) {
      toast.error("Please enter plot size");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      plotSize: currentPlot.plotSize,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated plot size for all plots");
  };

  const bulkUpdateBasicRate = () => {
    if (!currentPlot.basicRate) {
      toast.error("Please enter basic rate");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      basicRate: currentPlot.basicRate,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated basic rate for all plots");
  };

  const bulkUpdateBlock = () => {
    if (!currentPlot.block) {
      toast.error("Please enter block");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      block: currentPlot.block,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated block for all plots");
  };

  const bulkUpdateRegisteredCompany = () => {
    if (!currentPlot.registeredCompany) {
      toast.error("Please enter registered company");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      registeredCompany: currentPlot.registeredCompany,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated registered company for all plots");
  };

  const bulkUpdateFacing = () => {
    if (!currentPlot.facing) {
      toast.error("Please select facing");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      facing: currentPlot.facing,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated facing for all plots");
  };

  const bulkUpdateRoad = () => {
    if (!currentPlot.road) {
      toast.error("Please enter road");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      road: currentPlot.road,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated road for all plots");
  };

  const bulkUpdateLength = () => {
    if (!currentPlot.length) {
      toast.error("Please enter length");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      length: currentPlot.length,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated length for all plots");
  };

  const bulkUpdateWidth = () => {
    if (!currentPlot.width) {
      toast.error("Please enter width");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      width: currentPlot.width,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated width for all plots");
  };

  const bulkUpdateGataKhesraNo = () => {
    if (!currentPlot.gataKhesraNo) {
      toast.error("Please enter Gata/Khesra number");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      gataKhesraNo: currentPlot.gataKhesraNo,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated Gata/Khesra number for all plots");
  };

  const bulkUpdateTypeofPLC = () => {
    if (!currentPlot.typeofPLC) {
      toast.error("Please enter PLC type");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      typeofPLC: currentPlot.typeofPLC,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated PLC type for all plots");
  };

  const bulkUpdatePLCApplicable = () => {
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      plcApplicable: currentPlot.plcApplicable,
    }));
    setPlotsData(updatedPlots);
    toast.success(
      `Updated PLC applicable to ${
        currentPlot.plcApplicable ? "Yes" : "No"
      } for all plots`
    );
  };

  const bulkUpdateAvailablePlot = () => {
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      availablePlot: currentPlot.availablePlot,
    }));
    setPlotsData(updatedPlots);
    toast.success(
      `Updated availability to ${
        currentPlot.availablePlot ? "Available" : "Not Available"
      } for all plots`
    );
  };

  const bulkUpdateDescription = () => {
    if (!currentPlot.description) {
      toast.error("Please enter description");
      return;
    }
    const updatedPlots = plotsData.map((plot) => ({
      ...plot,
      description: currentPlot.description,
    }));
    setPlotsData(updatedPlots);
    toast.success("Updated description for all plots");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if site name is provided
    if (!siteName || siteName.trim() === "") {
      toast.error("Please enter Site Name before uploading CSV");
      event.target.value = ""; // Clear the file input
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const plots = parseCSVToPlotData(text);

        if (plots.length > 0) {
          // Validate the imported data
          const { errors, warnings } = validatePlotData(plots);

          if (errors.length > 0) {
            toast.error(`Found ${errors.length} errors in CSV data`);
            console.error("CSV validation errors:", errors);
          }

          if (warnings.length > 0) {
            toast(`Found ${warnings.length} warnings in CSV data`, {
              icon: "⚠️",
              duration: 3000,
            });
            console.warn("CSV validation warnings:", warnings);
          }

          setPlotsData(plots);
          toast.success(
            `Imported ${plots.length} plots from CSV for ${siteName}`
          );
        } else {
          toast.error("No valid plot data found in CSV");
        }
      } catch (error) {
        console.error("Error reading CSV file:", error);
        toast.error("Error reading CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const onSubmit = async (data) => {
    if (plotsData.length === 0) {
      toast.error("Please generate plots first");
      return;
    }

    const incompletePlots = plotsData.filter(
      (plot) => !plot.basicRate || parseFloat(plot.basicRate) <= 0
    );
    if (incompletePlots.length > 0) {
      toast.error(`${incompletePlots.length} plots are missing basic rate`);
      return;
    }

    try {
      setLoading(true);

      // Use bulk creation API
      const bulkData = {
        siteName: data.siteName,
        description: data.description || `Plots in ${data.siteName}`,
        plots: plotsData.map((plot) => ({
          block: plot.block || "",
          plotNumber: plot.plotNumber,
          length: parseFloat(plot.length) || 0,
          width: parseFloat(plot.width) || 0,

          plotSize: plot.plotSize,
          basicRate: parseFloat(plot.basicRate),
          road: plot.road || "",
          plcApplicable: plot.plcApplicable || false,
          typeofPLC: plot.typeofPLC || "",
          facing: plot.facing || "",
          registeredCompany: plot.registeredCompany || "",
          gataKhesraNo: plot.gataKhesraNo || "",
          availablePlot: plot.availablePlot !== false, // Default to true
        })),
      };

      const response = await plotsAPI.bulkCreatePlots(bulkData);
      const result = response.data;

      if (result.errors && result.errors.length > 0) {
        console.warn("Some plots had errors:", result.errors);
        toast(
          `Created ${result.createdCount} plots with ${result.errorCount} errors`,
          {
            icon: "⚠️",
            duration: 4000,
          }
        );
      } else {
        toast.success(`Successfully created ${result.createdCount} plots!`);
      }

      reset();
      setPlotsData([]);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating plots:", error);
      toast.error("Failed to create plots");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "Plot Number,Block,Registered Company,Length,Width,Plot Size,Basic Rate,Road,Facing,Gata/Khesra No,PLC Applicable,PLC Type,Available Plot,Description\n" +
      plotsData
        .map(
          (plot) =>
            `${plot.plotNumber},${plot.block},${plot.registeredCompany},${plot.length},${plot.width},${plot.plotSize},${plot.basicRate},${plot.road},${plot.facing},${plot.gataKhesraNo},${plot.plcApplicable},${plot.typeofPLC},${plot.availablePlot},${plot.description}`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${siteName.replace(/\s+/g, "_")}_plots.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    reset();
    setPlotsData([]);
    setCurrentPlot({
      plotNumber: "",
      block: "",
      registeredCompany: "",
      length: "",
      width: "",
      plotSize: "",
      basicRate: "",
      road: "",
      facing: "",
      gataKhesraNo: "",
      plcApplicable: false,
      typeofPLC: "",
      availablePlot: true,
      description: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Bulk Create Plots
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name *
              </label>
              <input
                {...register("siteName", {
                  required: "Site name is required",
                })}
                type="text"
                className="input"
                placeholder="Enter site name (e.g., Hare Krishna Township Phase 2)"
              />
              {errors.siteName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.siteName.message}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Please enter the site name before uploading CSV data
              </p>
            </div>

            {/* CSV Import Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">
                Import Plot Data from CSV
              </h4>
              {(!siteName || siteName.trim() === "") && (
                <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                  ⚠️ Please enter Site Name above before importing CSV data
                </div>
              )}

              <div className="space-y-4">
                {/* CSV Upload */}
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    disabled={!siteName || siteName.trim() === ""}
                    className="hidden"
                  />
                  <label
                    htmlFor="csv-upload"
                    className={`btn-secondary cursor-pointer ${
                      !siteName || siteName.trim() === ""
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-green-600">
                    <p>CSV should contain columns:</p>
                    <p>
                      Plot Number, Block, Length, Width, Plot Size, Road, PLC
                      Applicable, PLC Type, Facing, Registered Company,
                      Gata/Khesra, Available, Basic Rate
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href="/sample-plot-template.csv"
                      download="plot-template.csv"
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download CSV Template
                    </a>
                    <a
                      href="/test-plot-data.csv"
                      download="test-plot-data.csv"
                      className="inline-flex items-center text-xs text-green-600 hover:text-green-800"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Test CSV
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Update Controls */}
            {plotsData.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-4">
                  Bulk Update All Plots
                </h4>

                {/* Basic Information */}
                <div className="mb-6">
                  <h5 className="font-medium text-blue-800 mb-3">
                    Basic Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentPlot.block}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            block: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="e.g., A, B, C"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateBlock}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Block
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentPlot.registeredCompany}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            registeredCompany: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="Company name"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateRegisteredCompany}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Company
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plot Dimensions */}
                <div className="mb-6">
                  <h5 className="font-medium text-blue-800 mb-3">
                    Plot Dimensions
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={currentPlot.length}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            length: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="Length (ft)"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateLength}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Length
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={currentPlot.width}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            width: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="Width (ft)"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateWidth}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Width
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentPlot.plotSize}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            plotSize: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="e.g., 1000 sq yard"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdatePlotSize}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Size
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pricing & Location */}
                <div className="mb-6">
                  <h5 className="font-medium text-blue-800 mb-3">
                    Pricing & Location
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={currentPlot.basicRate}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            basicRate: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="e.g., 2500"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateBasicRate}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Rate
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentPlot.road}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            road: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="Road details"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateRoad}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Road
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <select
                        value={currentPlot.facing}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            facing: e.target.value,
                          }))
                        }
                        className="input flex-1"
                      >
                        <option value="">Select Facing</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North East">North East</option>
                        <option value="North West">North West</option>
                        <option value="South East">South East</option>
                        <option value="South West">South West</option>
                      </select>
                      <button
                        type="button"
                        onClick={bulkUpdateFacing}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Facing
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentPlot.gataKhesraNo}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            gataKhesraNo: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="Gata/Khesra No"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateGataKhesraNo}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Gata/Khesra
                      </button>
                    </div>
                  </div>
                </div>

                {/* PLC Information */}
                <div className="mb-6">
                  <h5 className="font-medium text-blue-800 mb-3">
                    PLC Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentPlot.plcApplicable}
                          onChange={(e) =>
                            setCurrentPlot((prev) => ({
                              ...prev,
                              plcApplicable: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          PLC Applicable
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={bulkUpdatePLCApplicable}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update PLC Status
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentPlot.typeofPLC}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            typeofPLC: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="PLC Type"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateTypeofPLC}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update PLC Type
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status & Description */}
                <div>
                  <h5 className="font-medium text-blue-800 mb-3">
                    Status & Description
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentPlot.availablePlot}
                          onChange={(e) =>
                            setCurrentPlot((prev) => ({
                              ...prev,
                              availablePlot: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Available for Sale
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={bulkUpdateAvailablePlot}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Availability
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentPlot.description}
                        onChange={(e) =>
                          setCurrentPlot((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="input flex-1"
                        placeholder="Description"
                      />
                      <button
                        type="button"
                        onClick={bulkUpdateDescription}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Update Description
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plots Data Table */}
            {plotsData.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">
                    Plots Data ({plotsData.length} plots)
                  </h4>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="btn-secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plot Number
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Block
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Length (ft)
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Width (ft)
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plot Size
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Basic Rate (₹)
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Road
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Facing
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gata/Khesra
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PLC
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PLC Type
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Available
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plotsData.map((plot, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-sm font-medium text-gray-900">
                            {plot.plotNumber}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={plot.block}
                              onChange={(e) =>
                                updatePlotData(index, "block", e.target.value)
                              }
                              className="input text-sm w-16"
                              placeholder="A"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={plot.registeredCompany}
                              onChange={(e) =>
                                updatePlotData(
                                  index,
                                  "registeredCompany",
                                  e.target.value
                                )
                              }
                              className="input text-sm w-24"
                              placeholder="Company"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={plot.length}
                              onChange={(e) =>
                                updatePlotData(index, "length", e.target.value)
                              }
                              className="input text-sm w-20"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={plot.width}
                              onChange={(e) =>
                                updatePlotData(index, "width", e.target.value)
                              }
                              className="input text-sm w-20"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={plot.plotSize}
                              onChange={(e) =>
                                updatePlotData(
                                  index,
                                  "plotSize",
                                  e.target.value
                                )
                              }
                              className="input text-sm w-28"
                              placeholder="1000 sq yard"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={plot.basicRate}
                              onChange={(e) =>
                                updatePlotData(
                                  index,
                                  "basicRate",
                                  e.target.value
                                )
                              }
                              className="input text-sm w-20"
                              placeholder="2500"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={plot.road}
                              onChange={(e) =>
                                updatePlotData(index, "road", e.target.value)
                              }
                              className="input text-sm w-24"
                              placeholder="Road"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={plot.facing}
                              onChange={(e) =>
                                updatePlotData(index, "facing", e.target.value)
                              }
                              className="input text-sm w-24"
                            >
                              <option value="">Select</option>
                              <option value="North">North</option>
                              <option value="South">South</option>
                              <option value="East">East</option>
                              <option value="West">West</option>
                              <option value="North East">North East</option>
                              <option value="North West">North West</option>
                              <option value="South East">South East</option>
                              <option value="South West">South West</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={plot.gataKhesraNo}
                              onChange={(e) =>
                                updatePlotData(
                                  index,
                                  "gataKhesraNo",
                                  e.target.value
                                )
                              }
                              className="input text-sm w-20"
                              placeholder="123"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={plot.plcApplicable}
                              onChange={(e) =>
                                updatePlotData(
                                  index,
                                  "plcApplicable",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={plot.typeofPLC}
                              onChange={(e) =>
                                updatePlotData(
                                  index,
                                  "typeofPLC",
                                  e.target.value
                                )
                              }
                              className="input text-sm w-20"
                              placeholder="Type"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={plot.availablePlot}
                              onChange={(e) =>
                                updatePlotData(
                                  index,
                                  "availablePlot",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || plotsData.length === 0}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Plots...
                  </>
                ) : (
                  `Create ${plotsData.length} Plots`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkCreatePlotsForm;
