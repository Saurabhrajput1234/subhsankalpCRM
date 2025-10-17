import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { X, Download, Plus } from "lucide-react";
import { plotsAPI } from "../../utils/api";
import LoadingSpinner from "../UI/LoadingSpinner";
import toast from "react-hot-toast";

const BulkCreatePlotsForm = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [plotsData, setPlotsData] = useState([]);
  const [currentPlot, setCurrentPlot] = useState({
    plotNumber: "",
    plotSize: "",
    basicRate: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      siteName: "Hare Krishna Township Phase 2",
      totalPlots: 800,
    },
  });

  const siteName = watch("siteName");
  const totalPlots = watch("totalPlots");

  const generatePlotNumbers = () => {
    const plots = [];
    for (let i = 1; i <= totalPlots; i++) {
      plots.push({
        plotNumber: `A-${i.toString().padStart(3, "0")}`,
        plotSize: "",
        basicRate: "",
      });
    }
    setPlotsData(plots);
    toast.success(`Generated ${totalPlots} plot numbers`);
  };

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

  const onSubmit = async (data) => {
    if (plotsData.length === 0) {
      toast.error("Please generate plots first");
      return;
    }

    const incompletePlots = plotsData.filter(
      (plot) => !plot.plotSize || !plot.basicRate
    );
    if (incompletePlots.length > 0) {
      toast.error(
        `${incompletePlots.length} plots are missing plot size or basic rate`
      );
      return;
    }

    try {
      setLoading(true);

      // Use bulk creation API
      const bulkData = {
        siteName: data.siteName,
        description: `Plots in ${data.siteName}`,
        plots: plotsData.map((plot) => ({
          plotNumber: plot.plotNumber,
          plotSize: plot.plotSize,
          basicRate: parseFloat(plot.basicRate),
        })),
      };

      const response = await plotsAPI.bulkCreatePlots(bulkData);
      const result = response.data;

      if (result.errors && result.errors.length > 0) {
        console.warn("Some plots had errors:", result.errors);
        toast.warning(
          `Created ${result.createdCount} plots with ${result.errorCount} errors`
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
      "Plot Number,Plot Size,Basic Rate\n" +
      plotsData
        .map((plot) => `${plot.plotNumber},${plot.plotSize},${plot.basicRate}`)
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
    setCurrentPlot({ plotNumber: "", plotSize: "", basicRate: "" });
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Enter site name"
                />
                {errors.siteName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.siteName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Plots *
                </label>
                <input
                  {...register("totalPlots", {
                    required: "Total plots is required",
                    min: { value: 1, message: "Must be at least 1" },
                    max: { value: 2000, message: "Maximum 2000 plots allowed" },
                  })}
                  type="number"
                  className="input"
                  placeholder="Enter total number of plots"
                />
                {errors.totalPlots && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.totalPlots.message}
                  </p>
                )}
              </div>
            </div>

            {/* Generate Plots Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={generatePlotNumbers}
                className="btn-primary"
                disabled={!siteName || !totalPlots}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Plot Numbers
              </button>
            </div>

            {/* Bulk Update Controls */}
            {plotsData.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">
                  Bulk Update All Plots
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="e.g., 1000 sq ft"
                    />
                    <button
                      type="button"
                      onClick={bulkUpdatePlotSize}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Update All Sizes
                    </button>
                  </div>
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
                      Update All Rates
                    </button>
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

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plot Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plot Size
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Basic Rate (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plotsData.map((plot, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {plot.plotNumber}
                          </td>
                          <td className="px-4 py-3">
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
                              className="input text-sm"
                              placeholder="e.g., 1000 sq ft"
                            />
                          </td>
                          <td className="px-4 py-3">
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
                              className="input text-sm"
                              placeholder="e.g., 2500"
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
