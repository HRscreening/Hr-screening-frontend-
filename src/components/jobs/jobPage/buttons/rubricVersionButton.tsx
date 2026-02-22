// import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check, History } from 'lucide-react';

import type { CriteriaOverview} from '@/types/newJobType';

interface RubricVersionSwitcherProps {
    versionData: CriteriaOverview;
    activeVersion: string | undefined;
    handleVersionChange: (version: string) => void;
}

const RubricVersionSwitcher = ({ versionData, activeVersion,handleVersionChange }: RubricVersionSwitcherProps) => {



    //   TODO: Use date-fns or similar library for date formatting and manipulation
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };



    return (
        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Rubric Version:</span>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 bg-white border border-gray-300 hover:border-blue-500 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                    <span>{activeVersion}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg p-1"
                >
                    <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Available Versions
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-gray-200 my-1" />

                    <div className="max-h-64 overflow-y-auto">
                        {versionData.versions
                            .sort((a, b) => b.version.localeCompare(a.version))
                            .map((version, index) => (
                                <DropdownMenuItem
                                    key={`${version.version}-${index}`}
                                    onClick={() => handleVersionChange(version.version)}
                                    className={`
                    flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer
                    transition-colors
                    ${activeVersion === version.version
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-sm">
                                            {version.version}
                                            {activeVersion === version.version && (
                                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                    Current
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Created {formatDate(version.created_at)}
                                        </span>
                                    </div>

                                    {activeVersion === version.version && (
                                        <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default RubricVersionSwitcher;